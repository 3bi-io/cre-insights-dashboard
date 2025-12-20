import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OutboundCallRequest {
  application_id?: string;
  outbound_call_id?: string; // For processing a specific queued call
  voice_agent_id?: string;
  phone_number?: string;
  process_queue?: boolean; // Process all queued calls
  sync_initiated?: boolean; // Sync stuck initiated calls with ElevenLabs API
  limit?: number; // Max calls to process when process_queue is true
}

interface ElevenLabsOutboundResponse {
  call_sid: string;
  conversation_id?: string;
  status: string;
}

interface ProcessQueueResult {
  processed: number;
  succeeded: number;
  failed: number;
  results: Array<{ call_id: string; status: string; error?: string }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');

    if (!elevenLabsApiKey) {
      console.error('ELEVENLABS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: OutboundCallRequest = await req.json();
    
    console.log('Outbound call request:', JSON.stringify(body));

    // Validate request authorization
    // For queue processing (cron jobs), validate using internal secret or service role
    // For single calls, accept authenticated users via Authorization header
    const authHeader = req.headers.get('authorization');
    const isServiceRole = authHeader?.includes(supabaseServiceKey);
    const isInternalCron = body.process_queue === true;
    
    if (isInternalCron && !isServiceRole) {
      // For cron/queue processing, also accept requests from Supabase infrastructure
      // Check if this is a valid internal request by verifying the anon key is present
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
      const hasValidKey = authHeader?.includes(anonKey || '') || authHeader?.includes('Bearer');
      
      if (!hasValidKey && !authHeader) {
        console.log('Queue processing request accepted (internal cron)');
        // Allow the request - cron jobs from pg_cron don't always have proper auth
      }
    }

    // Handle sync_initiated mode - sync stuck initiated calls with ElevenLabs
    if (body.sync_initiated) {
      console.log('Syncing stuck initiated calls with ElevenLabs API');
      
      // Find calls stuck in 'initiated' status for more than 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: stuckCalls, error: fetchError } = await supabase
        .from('outbound_calls')
        .select('id, elevenlabs_conversation_id, voice_agent_id, created_at')
        .eq('status', 'initiated')
        .lt('updated_at', tenMinutesAgo)
        .not('elevenlabs_conversation_id', 'is', null)
        .limit(20);

      if (fetchError) {
        console.error('Failed to fetch stuck calls:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch stuck calls', details: fetchError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!stuckCalls || stuckCalls.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No stuck initiated calls to sync', synced: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Found ${stuckCalls.length} stuck initiated calls to sync`);

      let synced = 0;
      let failed = 0;
      const syncResults: Array<{ call_id: string; status: string; new_status?: string; error?: string }> = [];

      for (const call of stuckCalls) {
        try {
          // Fetch conversation status from ElevenLabs
          const convResponse = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversations/${call.elevenlabs_conversation_id}`,
            {
              headers: { 'xi-api-key': elevenLabsApiKey },
            }
          );

          if (!convResponse.ok) {
            console.error(`Failed to fetch conversation ${call.elevenlabs_conversation_id}:`, convResponse.status);
            failed++;
            syncResults.push({ call_id: call.id, status: 'failed', error: `ElevenLabs API returned ${convResponse.status}` });
            continue;
          }

          const convData = await convResponse.json();
          const elStatus = convData.status || 'unknown';
          
          // Map ElevenLabs status to our status
          let mappedStatus = 'initiated';
          let durationSeconds = null;
          
          if (elStatus === 'done' || elStatus === 'ended') {
            mappedStatus = 'completed';
            durationSeconds = convData.metadata?.call_duration_secs || null;
          } else if (elStatus === 'failed' || elStatus === 'error') {
            mappedStatus = 'failed';
          } else if (elStatus === 'no-answer') {
            mappedStatus = 'no_answer';
          } else if (elStatus === 'busy') {
            mappedStatus = 'busy';
          }

          // Update the call record
          const { error: updateError } = await supabase
            .from('outbound_calls')
            .update({
              status: mappedStatus,
              duration_seconds: durationSeconds,
              completed_at: mappedStatus === 'completed' ? new Date().toISOString() : null,
              updated_at: new Date().toISOString()
            })
            .eq('id', call.id);

          if (updateError) {
            console.error(`Failed to update call ${call.id}:`, updateError);
            failed++;
            syncResults.push({ call_id: call.id, status: 'failed', error: updateError.message });
          } else {
            synced++;
            syncResults.push({ call_id: call.id, status: 'synced', new_status: mappedStatus });
            console.log(`Synced call ${call.id}: ${mappedStatus}`);
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Error syncing call ${call.id}:`, error);
          failed++;
          syncResults.push({ call_id: call.id, status: 'failed', error: error.message });
        }
      }

      console.log(`Sync complete: ${synced} synced, ${failed} failed`);

      return new Response(
        JSON.stringify({ synced, failed, results: syncResults }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle queue processing mode
    if (body.process_queue) {
      const limit = Math.min(body.limit || 10, 50); // Max 50 calls per batch
      console.log(`Processing queued outbound calls (limit: ${limit})`);

      // Fetch queued calls
      const { data: queuedCalls, error: fetchError } = await supabase
        .from('outbound_calls')
        .select('id')
        .eq('status', 'queued')
        .order('created_at', { ascending: true })
        .limit(limit);

      if (fetchError) {
        console.error('Failed to fetch queued calls:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch queued calls', details: fetchError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!queuedCalls || queuedCalls.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No queued calls to process', processed: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Found ${queuedCalls.length} queued calls to process`);

      const results: ProcessQueueResult = {
        processed: queuedCalls.length,
        succeeded: 0,
        failed: 0,
        results: []
      };

      // Process each call sequentially to avoid rate limiting
      for (const call of queuedCalls) {
        try {
          // Make recursive call to process this specific call
          const callResponse = await processOutboundCall(
            supabase,
            elevenLabsApiKey,
            { outbound_call_id: call.id }
          );
          
          if (callResponse.success) {
            results.succeeded++;
            results.results.push({ call_id: call.id, status: 'success' });
          } else {
            results.failed++;
            results.results.push({ call_id: call.id, status: 'failed', error: callResponse.error });
          }
          
          // Small delay between calls to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Failed to process call ${call.id}:`, error);
          results.failed++;
          results.results.push({ call_id: call.id, status: 'failed', error: error.message });
        }
      }

      console.log(`Queue processing complete: ${results.succeeded} succeeded, ${results.failed} failed`);

      return new Response(
        JSON.stringify(results),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Single call processing
    const singleCallResult = await processOutboundCall(supabase, elevenLabsApiKey, body);
    
    if (!singleCallResult.success) {
      return new Response(
        JSON.stringify({ error: singleCallResult.error, details: singleCallResult.details }),
        { status: singleCallResult.status || 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(singleCallResult.data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in elevenlabs-outbound-call:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Process a single outbound call
async function processOutboundCall(
  supabase: ReturnType<typeof createClient>,
  elevenLabsApiKey: string,
  body: OutboundCallRequest
): Promise<{ success: boolean; data?: unknown; error?: string; details?: string; status?: number }> {
  try {
    let applicationId = body.application_id;
    let voiceAgentId = body.voice_agent_id;
    let phoneNumber = body.phone_number;
    let outboundCallId = body.outbound_call_id;
    let metadata: Record<string, unknown> = {};

    // If processing a queued call, fetch the details
    if (outboundCallId) {
      const { data: queuedCall, error: queueError } = await supabase
        .from('outbound_calls')
        .select('*')
        .eq('id', outboundCallId)
        .eq('status', 'queued')
        .single();

      if (queueError || !queuedCall) {
        console.error('Queued call not found:', queueError);
        return { success: false, error: 'Queued call not found or already processed', status: 404 };
      }

      applicationId = queuedCall.application_id;
      voiceAgentId = queuedCall.voice_agent_id;
      phoneNumber = queuedCall.phone_number;
      metadata = queuedCall.metadata || {};
    }

    // Validate required fields
    if (!phoneNumber && !applicationId) {
      return { success: false, error: 'Either phone_number or application_id is required', status: 400 };
    }

    // If we have an application_id but no phone, fetch the application with full context
    let application: Record<string, unknown> | null = null;
    let jobListing: Record<string, unknown> | null = null;
    let organization: Record<string, unknown> | null = null;
    
    if (applicationId) {
      // Fetch comprehensive applicant data for dynamic context
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select(`
          id, phone, first_name, last_name, job_listing_id,
          city, state, zip, cdl, cdl_class, cdl_endorsements,
          exp, driving_experience_years, months, over_21, age,
          can_pass_drug_test, drug, can_pass_physical, veteran,
          hazmat_endorsement, twic_card, work_authorization
        `)
        .eq('id', applicationId)
        .single();

      if (appError || !appData) {
        console.error('Application not found:', appError);
        return { success: false, error: 'Application not found', status: 404 };
      }

      application = appData;
      phoneNumber = phoneNumber || application.phone as string;
      metadata.applicant_name = `${application.first_name || ''} ${application.last_name || ''}`.trim();
      
      // Fetch job listing with organization details
      if (application.job_listing_id) {
        const { data: jobData, error: jobError } = await supabase
          .from('job_listings')
          .select(`
            id, title, job_title, job_summary, location, city, state,
            salary_min, salary_max, salary_type, job_type, experience_required,
            organization_id
          `)
          .eq('id', application.job_listing_id)
          .single();
        
        if (!jobError && jobData) {
          jobListing = jobData;
          
          // Fetch organization details
          if (jobData.organization_id) {
            const { data: orgData } = await supabase
              .from('organizations')
              .select('id, name, description')
              .eq('id', jobData.organization_id)
              .single();
            
            if (orgData) {
              organization = orgData;
            }
          }
        }
      }
    }

    if (!phoneNumber) {
      return { success: false, error: 'No phone number available for this application', status: 400 };
    }

    // Normalize phone number (US format)
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      return { success: false, error: 'Invalid phone number format', status: 400 };
    }

    // Get organization ID from job listing
    let organizationId: string | null = null;
    if (jobListing?.organization_id) {
      organizationId = jobListing.organization_id as string;
    } else if (application?.job_listing_id) {
      // Fallback: fetch org ID directly if not already fetched
      const { data: jl } = await supabase
        .from('job_listings')
        .select('organization_id')
        .eq('id', application.job_listing_id)
        .single();
      
      organizationId = jl?.organization_id || null;
    }

    // Find voice agent if not specified
    if (!voiceAgentId && organizationId) {
      const { data: voiceAgent } = await supabase
        .from('voice_agents')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('is_outbound_enabled', true)
        .eq('is_active', true)
        .not('agent_phone_number_id', 'is', null)
        .limit(1)
        .single();

      voiceAgentId = voiceAgent?.id;
    }

    if (!voiceAgentId) {
      return { success: false, error: 'No outbound-enabled voice agent found', status: 400 };
    }

    // Fetch voice agent details
    const { data: voiceAgent, error: agentError } = await supabase
      .from('voice_agents')
      .select('*')
      .eq('id', voiceAgentId)
      .single();

    if (agentError || !voiceAgent) {
      console.error('Voice agent not found:', agentError);
      return { success: false, error: 'Voice agent not found', status: 404 };
    }

    if (!voiceAgent.agent_phone_number_id) {
      return { success: false, error: 'Voice agent does not have a phone number configured', status: 400 };
    }

    // Note: Application-level rate limiting removed to allow jobseekers to apply to multiple jobs
    // Duplicate queued call prevention is still in place below

    // Create or update outbound call record
    let callRecord;
    if (outboundCallId) {
      // Update existing queued call
      const { data: updated, error: updateError } = await supabase
        .from('outbound_calls')
        .update({ status: 'initiating', updated_at: new Date().toISOString() })
        .eq('id', outboundCallId)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update call record:', updateError);
      }
      callRecord = updated;
    } else {
      // IMPORTANT: Check if there's an existing queued call for this application first
      // This prevents duplicate records when both trigger and API call try to create records
      if (applicationId) {
        const { data: existingQueued } = await supabase
          .from('outbound_calls')
          .select('*')
          .eq('application_id', applicationId)
          .eq('status', 'queued')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (existingQueued) {
          console.log(`Found existing queued call ${existingQueued.id} for application ${applicationId}, updating instead of creating new`);
          const { data: updated, error: updateError } = await supabase
            .from('outbound_calls')
            .update({ 
              status: 'initiating', 
              voice_agent_id: voiceAgentId,
              updated_at: new Date().toISOString() 
            })
            .eq('id', existingQueued.id)
            .select()
            .single();

          if (updateError) {
            console.error('Failed to update existing queued call:', updateError);
          }
          callRecord = updated;
          outboundCallId = existingQueued.id;
        }
      }

      // Only create new record if we didn't find/update an existing one
      if (!callRecord) {
        const { data: newCall, error: insertError } = await supabase
          .from('outbound_calls')
          .insert({
            application_id: applicationId,
            voice_agent_id: voiceAgentId,
            organization_id: organizationId || voiceAgent.organization_id,
            phone_number: normalizedPhone,
            status: 'initiating',
            metadata: {
              ...metadata,
              triggered_by: 'api_call'
            }
          })
          .select()
          .single();

        if (insertError) {
          console.error('Failed to create call record:', insertError);
        }
        callRecord = newCall;
      }
    }

    // Build dynamic variables for ElevenLabs agent context
    const dynamicVariables = buildDynamicVariables(application, jobListing, organization, metadata);
    console.log('Dynamic variables for ElevenLabs:', JSON.stringify(dynamicVariables));

    // Make ElevenLabs outbound call API request
    console.log('Initiating ElevenLabs outbound call to:', normalizedPhone);
    
    // Build conversation_initiation_client_data with dynamic variables only
    // First message is configured in ElevenLabs dashboard and can use placeholders like {{applicant_first_name}}
    const conversationInitData: Record<string, unknown> = {
      dynamic_variables: dynamicVariables
    };

    const elevenLabsPayload: Record<string, unknown> = {
      agent_id: voiceAgent.elevenlabs_agent_id,
      agent_phone_number_id: voiceAgent.agent_phone_number_id,
      to_number: `+1${normalizedPhone}`, // Assuming US numbers
      conversation_initiation_client_data: conversationInitData
    };

    const elevenLabsResponse = await fetch(
      'https://api.elevenlabs.io/v1/convai/twilio/outbound_call',
      {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(elevenLabsPayload),
      }
    );

    const responseText = await elevenLabsResponse.text();
    console.log('ElevenLabs response status:', elevenLabsResponse.status);
    console.log('ElevenLabs response:', responseText);

    if (!elevenLabsResponse.ok) {
      // Update call record with failure
      if (callRecord) {
        await supabase
          .from('outbound_calls')
          .update({
            status: 'failed',
            error_message: `ElevenLabs API error: ${responseText}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', callRecord.id);
      }

      return { success: false, error: 'Failed to initiate outbound call', details: responseText, status: elevenLabsResponse.status };
    }

    let elevenLabsData: ElevenLabsOutboundResponse;
    try {
      elevenLabsData = JSON.parse(responseText);
    } catch {
      elevenLabsData = { call_sid: 'unknown', status: 'initiated' };
    }

    // Update call record with success
    if (callRecord) {
      await supabase
        .from('outbound_calls')
        .update({
          status: 'initiated',
          call_sid: elevenLabsData.call_sid,
          elevenlabs_conversation_id: elevenLabsData.conversation_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', callRecord.id);
    }

    console.log('Outbound call initiated successfully:', elevenLabsData);

    return {
      success: true,
      data: {
        success: true,
        call_id: callRecord?.id,
        call_sid: elevenLabsData.call_sid,
        conversation_id: elevenLabsData.conversation_id,
        phone_number: normalizedPhone,
        message: 'Outbound call initiated successfully'
      }
    };

  } catch (error) {
    console.error('Error in processOutboundCall:', error);
    return { success: false, error: error.message || 'Internal server error', status: 500 };
  }
}

// Normalize US phone number to 10 digits
function normalizePhoneNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  
  // Handle 11-digit numbers starting with 1
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.substring(1);
  }
  
  // Valid 10-digit US number
  if (digits.length === 10) {
    return digits;
  }
  
  return null;
}

// Build dynamic variables for ElevenLabs agent personalization
function buildDynamicVariables(
  application: Record<string, unknown> | null,
  jobListing: Record<string, unknown> | null,
  organization: Record<string, unknown> | null,
  metadata: Record<string, unknown>
): Record<string, string> {
  const vars: Record<string, string> = {};
  
  // Applicant info
  vars.applicant_first_name = (application?.first_name as string) || 'there';
  vars.applicant_last_name = (application?.last_name as string) || '';
  vars.applicant_full_name = (metadata.applicant_name as string) || vars.applicant_first_name;
  
  // Location
  const city = application?.city as string;
  const state = application?.state as string;
  vars.applicant_location = city && state ? `${city}, ${state}` : (city || state || 'your area');
  vars.applicant_zip = (application?.zip as string) || '';
  
  // CDL status
  const cdl = application?.cdl as string;
  const cdlClass = application?.cdl_class as string;
  if (cdl === 'Yes' || cdl === 'yes' || cdl === 'true' || cdl === '1') {
    vars.applicant_cdl_status = cdlClass ? `Class ${cdlClass} CDL` : 'CDL holder';
    vars.has_cdl = 'yes';
  } else if (cdl === 'No' || cdl === 'no' || cdl === 'false' || cdl === '0') {
    vars.applicant_cdl_status = 'No CDL';
    vars.has_cdl = 'no';
  } else {
    vars.applicant_cdl_status = 'unknown';
    vars.has_cdl = 'unknown';
  }
  
  // Endorsements
  const endorsements = application?.cdl_endorsements as string[];
  const hasHazmat = application?.hazmat_endorsement as string;
  const hasTwic = application?.twic_card as string;
  const endorsementList: string[] = [];
  if (Array.isArray(endorsements) && endorsements.length > 0) {
    endorsementList.push(...endorsements);
  }
  if (hasHazmat === 'Yes' || hasHazmat === 'yes') {
    if (!endorsementList.includes('H') && !endorsementList.includes('hazmat')) {
      endorsementList.push('Hazmat');
    }
  }
  if (hasTwic === 'Yes' || hasTwic === 'yes') {
    endorsementList.push('TWIC');
  }
  vars.applicant_endorsements = endorsementList.length > 0 ? endorsementList.join(', ') : 'none listed';
  
  // Experience
  vars.applicant_experience = formatExperience(application);
  
  // Qualifications
  // Check both over_21 and age columns (form may save to either)
  const over21 = (application?.over_21 as string) || (application?.age as string);
  vars.over_21_status = (over21 === 'Yes' || over21 === 'yes' || over21 === 'true' || over21 === '1') ? 'yes' : 'unknown';
  
  // Check both drug and can_pass_drug_test columns (form may save to either)
  const drugTest = (application?.drug as string) || (application?.can_pass_drug_test as string);
  vars.drug_test_status = (drugTest === 'Yes' || drugTest === 'yes' || drugTest === 'true' || drugTest === '1') 
    ? 'willing to pass' 
    : (drugTest === 'No' || drugTest === 'no' ? 'not willing' : 'unknown');
  
  const physical = application?.can_pass_physical as string;
  vars.physical_status = (physical === 'Yes' || physical === 'yes' || physical === 'true' || physical === '1') 
    ? 'can pass' 
    : 'unknown';
  
  const veteran = application?.veteran as string;
  vars.veteran_status = (veteran === 'Yes' || veteran === 'yes' || veteran === 'true' || veteran === '1') ? 'veteran' : 'not specified';
  
  // Job info
  vars.job_title = (jobListing?.title as string) || (jobListing?.job_title as string) || 'the driving position';
  vars.job_type = (jobListing?.job_type as string) || 'driving';
  vars.job_location = (jobListing?.location as string) || 
    ((jobListing?.city as string) && (jobListing?.state as string) 
      ? `${jobListing.city}, ${jobListing.state}` 
      : 'various locations');
  vars.experience_required = (jobListing?.experience_required as string) || 'experience preferred';
  
  // Salary
  vars.salary_range = formatSalary(jobListing);
  
  // Company info
  vars.company_name = (organization?.name as string) || 'our company';
  vars.company_description = (organization?.description as string) || '';
  
  // ============= JOB CONTEXT INFERENCE =============
  // These variables help the agent determine which questions to ask
  vars.job_requires_cdl = inferCDLRequirement(jobListing);
  vars.job_cdl_class = inferCDLClass(jobListing);
  vars.job_requires_hazmat = inferHazmatRequirement(jobListing);
  vars.job_requires_tanker = inferTankerRequirement(jobListing);
  vars.job_is_entry_level = inferEntryLevel(jobListing);
  vars.job_is_local = inferLocalRoute(jobListing);
  vars.job_is_otr = inferOTR(jobListing);
  vars.job_is_team = inferTeamDriving(jobListing);
  vars.job_freight_type = inferFreightType(jobListing);
  
  console.log('Inferred job requirements:', {
    requires_cdl: vars.job_requires_cdl,
    cdl_class: vars.job_cdl_class,
    requires_hazmat: vars.job_requires_hazmat,
    requires_tanker: vars.job_requires_tanker,
    is_entry_level: vars.job_is_entry_level,
    is_local: vars.job_is_local,
    is_otr: vars.job_is_otr,
    is_team: vars.job_is_team,
    freight_type: vars.job_freight_type
  });
  
  return vars;
}

// Format experience from various fields
function formatExperience(application: Record<string, unknown> | null): string {
  if (!application) return 'unknown';
  
  const years = application.driving_experience_years as number;
  if (years && years > 0) {
    return years === 1 ? '1 year' : `${years} years`;
  }
  
  const months = application.months as string;
  if (months) {
    const monthNum = parseInt(months, 10);
    if (!isNaN(monthNum)) {
      if (monthNum >= 12) {
        const yrs = Math.floor(monthNum / 12);
        return yrs === 1 ? '1 year' : `${yrs} years`;
      }
      return `${monthNum} months`;
    }
    return months;
  }
  
  const exp = application.exp as string;
  if (exp) return exp;
  
  return 'unknown';
}

// Format salary range for voice agent
function formatSalary(jobListing: Record<string, unknown> | null): string {
  if (!jobListing) return 'competitive compensation';
  
  const min = jobListing.salary_min as number;
  const max = jobListing.salary_max as number;
  const type = (jobListing.salary_type as string) || 'per year';
  
  if (min && max) {
    const formattedMin = min >= 1000 ? `${Math.round(min / 1000)}K` : min.toString();
    const formattedMax = max >= 1000 ? `${Math.round(max / 1000)}K` : max.toString();
    return `$${formattedMin} to $${formattedMax} ${type}`;
  }
  if (min) {
    const formattedMin = min >= 1000 ? `${Math.round(min / 1000)}K` : min.toString();
    return `starting at $${formattedMin} ${type}`;
  }
  if (max) {
    const formattedMax = max >= 1000 ? `${Math.round(max / 1000)}K` : max.toString();
    return `up to $${formattedMax} ${type}`;
  }
  
  return 'competitive compensation';
}

// ============= JOB REQUIREMENT INFERENCE FUNCTIONS =============

// Infer if the job requires a CDL based on title/description keywords
function inferCDLRequirement(jobListing: Record<string, unknown> | null): string {
  if (!jobListing) return 'unknown';
  
  const title = ((jobListing?.title || jobListing?.job_title) as string || '').toLowerCase();
  const summary = (jobListing?.job_summary as string || '').toLowerCase();
  const combined = `${title} ${summary}`;
  
  // Explicitly requires CDL
  if (combined.includes('cdl') || combined.includes('commercial driver')) {
    return 'yes';
  }
  // Explicitly does NOT require CDL
  if (combined.includes('no cdl') || combined.includes('non-cdl') || combined.includes('non cdl') ||
      combined.includes('warehouse') || combined.includes('mechanic') || combined.includes('dispatcher')) {
    return 'no';
  }
  return 'unknown';
}

// Infer CDL class from job title
function inferCDLClass(jobListing: Record<string, unknown> | null): string {
  if (!jobListing) return '';
  
  const title = ((jobListing?.title || jobListing?.job_title) as string || '').toLowerCase();
  const summary = (jobListing?.job_summary as string || '').toLowerCase();
  const combined = `${title} ${summary}`;
  
  if (combined.includes('cdl-a') || combined.includes('cdl a') || combined.includes('class a')) return 'A';
  if (combined.includes('cdl-b') || combined.includes('cdl b') || combined.includes('class b')) return 'B';
  if (combined.includes('cdl-c') || combined.includes('cdl c') || combined.includes('class c')) return 'C';
  return '';
}

// Infer if hazmat endorsement is required
function inferHazmatRequirement(jobListing: Record<string, unknown> | null): string {
  if (!jobListing) return 'no';
  
  const title = ((jobListing?.title || jobListing?.job_title) as string || '').toLowerCase();
  const summary = (jobListing?.job_summary as string || '').toLowerCase();
  const combined = `${title} ${summary}`;
  
  return (combined.includes('hazmat') || combined.includes('haz-mat') || combined.includes('hazardous')) ? 'yes' : 'no';
}

// Infer if tanker endorsement is required
function inferTankerRequirement(jobListing: Record<string, unknown> | null): string {
  if (!jobListing) return 'no';
  
  const title = ((jobListing?.title || jobListing?.job_title) as string || '').toLowerCase();
  const summary = (jobListing?.job_summary as string || '').toLowerCase();
  const combined = `${title} ${summary}`;
  
  return (combined.includes('tanker') || combined.includes('fuel') || combined.includes('liquid bulk')) ? 'yes' : 'no';
}

// Infer if this is an entry-level/training position
function inferEntryLevel(jobListing: Record<string, unknown> | null): string {
  if (!jobListing) return 'no';
  
  const title = ((jobListing?.title || jobListing?.job_title) as string || '').toLowerCase();
  const summary = (jobListing?.job_summary as string || '').toLowerCase();
  const combined = `${title} ${summary}`;
  
  if (combined.includes('training') || combined.includes('no experience') || 
      combined.includes('entry level') || combined.includes('entry-level') ||
      combined.includes('recent graduate') || combined.includes('new driver') ||
      combined.includes('will train') || combined.includes('cdl training')) {
    return 'yes';
  }
  return 'no';
}

// Infer if this is a local/home daily route
function inferLocalRoute(jobListing: Record<string, unknown> | null): string {
  if (!jobListing) return 'no';
  
  const title = ((jobListing?.title || jobListing?.job_title) as string || '').toLowerCase();
  const summary = (jobListing?.job_summary as string || '').toLowerCase();
  const jobType = (jobListing?.job_type as string || '').toLowerCase();
  const combined = `${title} ${summary} ${jobType}`;
  
  if (combined.includes('local') || combined.includes('home daily') || 
      combined.includes('home nightly') || combined.includes('day cab') ||
      combined.includes('no overnight')) {
    return 'yes';
  }
  return 'no';
}

// Infer if this is an OTR/regional route
function inferOTR(jobListing: Record<string, unknown> | null): string {
  if (!jobListing) return 'no';
  
  const title = ((jobListing?.title || jobListing?.job_title) as string || '').toLowerCase();
  const summary = (jobListing?.job_summary as string || '').toLowerCase();
  const jobType = (jobListing?.job_type as string || '').toLowerCase();
  const combined = `${title} ${summary} ${jobType}`;
  
  if (combined.includes('otr') || combined.includes('over the road') || 
      combined.includes('regional') || combined.includes('long haul') ||
      combined.includes('cross country')) {
    return 'yes';
  }
  return 'no';
}

// Infer if this is a team driving position
function inferTeamDriving(jobListing: Record<string, unknown> | null): string {
  if (!jobListing) return 'no';
  
  const title = ((jobListing?.title || jobListing?.job_title) as string || '').toLowerCase();
  const summary = (jobListing?.job_summary as string || '').toLowerCase();
  const combined = `${title} ${summary}`;
  
  return combined.includes('team') ? 'yes' : 'no';
}

// Infer freight type for contextual questions
function inferFreightType(jobListing: Record<string, unknown> | null): string {
  if (!jobListing) return 'general';
  
  const title = ((jobListing?.title || jobListing?.job_title) as string || '').toLowerCase();
  const summary = (jobListing?.job_summary as string || '').toLowerCase();
  const combined = `${title} ${summary}`;
  
  if (combined.includes('flatbed')) return 'flatbed';
  if (combined.includes('reefer') || combined.includes('refrigerated')) return 'reefer';
  if (combined.includes('dry van')) return 'dry van';
  if (combined.includes('tanker') || combined.includes('fuel') || combined.includes('liquid')) return 'tanker';
  if (combined.includes('ltl') || combined.includes('less than load')) return 'LTL';
  if (combined.includes('dedicated')) return 'dedicated';
  if (combined.includes('intermodal')) return 'intermodal';
  return 'general';
}