/**
 * ElevenLabs Outbound Call Edge Function
 * Handles outbound voice calls using ElevenLabs Conversational AI
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { successResponse, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/logger.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const logger = createLogger('elevenlabs-outbound-call');

// Request validation schema
const OutboundCallRequestSchema = z.object({
  application_id: z.string().uuid().optional(),
  outbound_call_id: z.string().uuid().optional(),
  voice_agent_id: z.string().uuid().optional(),
  phone_number: z.string().optional(),
  process_queue: z.boolean().optional(),
  sync_initiated: z.boolean().optional(),
  limit: z.number().min(1).max(50).optional(),
});

type OutboundCallRequest = z.infer<typeof OutboundCallRequestSchema>;

interface ElevenLabsOutboundResponse {
  call_sid?: string;
  callSid?: string;
  conversation_id?: string;
  status?: string;
  success?: boolean;
  message?: string;
}

interface ProcessQueueResult {
  processed: number;
  succeeded: number;
  failed: number;
  results: Array<{ call_id: string; status: string; error?: string }>;
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');

    if (!elevenLabsApiKey) {
      logger.error('ELEVENLABS_API_KEY not configured');
      return errorResponse('ElevenLabs API key not configured', 500, undefined, origin);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const rawBody = await req.json();
    
    // Validate request body
    const parseResult = OutboundCallRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      logger.warn('Invalid request body', { errors: parseResult.error.errors });
      return errorResponse('Invalid request body', 400, { errors: parseResult.error.errors }, origin);
    }
    
    const body = parseResult.data;
    logger.info('Outbound call request', { body });

    // Handle sync_initiated mode - sync stuck initiated calls with ElevenLabs
    if (body.sync_initiated) {
      logger.info('Syncing stuck initiated calls with ElevenLabs API');
      
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: stuckCalls, error: fetchError } = await supabase
        .from('outbound_calls')
        .select('id, elevenlabs_conversation_id, voice_agent_id, created_at')
        .eq('status', 'initiated')
        .lt('updated_at', tenMinutesAgo)
        .not('elevenlabs_conversation_id', 'is', null)
        .limit(20);

      if (fetchError) {
        logger.error('Failed to fetch stuck calls', { error: fetchError });
        return errorResponse('Failed to fetch stuck calls', 500, { details: fetchError.message }, origin);
      }

      if (!stuckCalls || stuckCalls.length === 0) {
        return successResponse({ message: 'No stuck initiated calls to sync', synced: 0 }, undefined, undefined, origin);
      }

      logger.info(`Found ${stuckCalls.length} stuck initiated calls to sync`);

      let synced = 0;
      let failed = 0;
      const syncResults: Array<{ call_id: string; status: string; new_status?: string; error?: string }> = [];

      for (const call of stuckCalls) {
        try {
          const convResponse = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversations/${call.elevenlabs_conversation_id}`,
            { headers: { 'xi-api-key': elevenLabsApiKey } }
          );

          if (!convResponse.ok) {
            logger.error(`Failed to fetch conversation ${call.elevenlabs_conversation_id}`, { status: convResponse.status });
            failed++;
            syncResults.push({ call_id: call.id, status: 'failed', error: `ElevenLabs API returned ${convResponse.status}` });
            continue;
          }

          const convData = await convResponse.json();
          const elStatus = convData.status || 'unknown';
          
          let mappedStatus = 'initiated';
          let durationSeconds = null;
          
          if (elStatus === 'done' || elStatus === 'ended') {
            durationSeconds = convData.metadata?.call_duration_secs || null;
            // If call ended with 0 or no duration, driver didn't answer
            if (!durationSeconds || durationSeconds <= 0) {
              mappedStatus = 'no_answer';
              logger.info(`Call ${call.id} ended with no duration - marking as no_answer`);
            } else {
              mappedStatus = 'completed';
            }
          } else if (elStatus === 'failed' || elStatus === 'error') {
            mappedStatus = 'failed';
          } else if (elStatus === 'no-answer') {
            mappedStatus = 'no_answer';
          } else if (elStatus === 'busy') {
            mappedStatus = 'busy';
          }

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
            logger.error(`Failed to update call ${call.id}`, { error: updateError });
            failed++;
            syncResults.push({ call_id: call.id, status: 'failed', error: updateError.message });
          } else {
            synced++;
            syncResults.push({ call_id: call.id, status: 'synced', new_status: mappedStatus });
            logger.info(`Synced call ${call.id}`, { new_status: mappedStatus });
          }

          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          logger.error(`Error syncing call ${call.id}`, { error });
          failed++;
          syncResults.push({ call_id: call.id, status: 'failed', error: (error as Error).message });
        }
      }

      logger.info('Sync complete', { synced, failed });
      return successResponse({ synced, failed, results: syncResults }, undefined, undefined, origin);
    }

    // Handle queue processing mode
    if (body.process_queue) {
      const limit = Math.min(body.limit || 10, 50);
      logger.info(`Processing queued outbound calls (limit: ${limit})`);

      // Promote scheduled calls whose scheduled_at has passed to queued
      const { data: promoted, error: promoteError } = await supabase
        .from('outbound_calls')
        .update({ status: 'queued', updated_at: new Date().toISOString() })
        .eq('status', 'scheduled')
        .lte('scheduled_at', new Date().toISOString())
        .select('id');

      if (promoteError) {
        logger.warn('Failed to promote scheduled calls', { error: promoteError });
      } else if (promoted && promoted.length > 0) {
        logger.info(`Promoted ${promoted.length} scheduled calls to queued`);
      }

      // Safety net: also promote scheduled calls with NULL scheduled_at
      const { data: promotedNull, error: promoteNullError } = await supabase
        .from('outbound_calls')
        .update({ status: 'queued', updated_at: new Date().toISOString() })
        .eq('status', 'scheduled')
        .is('scheduled_at', null)
        .select('id');

      if (promoteNullError) {
        logger.warn('Failed to promote NULL scheduled_at calls', { error: promoteNullError });
      } else if (promotedNull && promotedNull.length > 0) {
        logger.info(`Promoted ${promotedNull.length} NULL scheduled_at calls to queued`);
      }

      const { data: queuedCalls, error: fetchError } = await supabase
        .from('outbound_calls')
        .select('id')
        .eq('status', 'queued')
        .order('created_at', { ascending: true })
        .limit(limit);

      if (fetchError) {
        logger.error('Failed to fetch queued calls', { error: fetchError });
        return errorResponse('Failed to fetch queued calls', 500, { details: fetchError.message }, origin);
      }

      if (!queuedCalls || queuedCalls.length === 0) {
        return successResponse({ message: 'No queued calls to process', processed: 0 }, undefined, undefined, origin);
      }

      logger.info(`Found ${queuedCalls.length} queued calls to process`);

      const results: ProcessQueueResult = {
        processed: queuedCalls.length,
        succeeded: 0,
        failed: 0,
        results: []
      };

      for (const call of queuedCalls) {
        try {
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
          
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          logger.error(`Failed to process call ${call.id}`, { error });
          results.failed++;
          results.results.push({ call_id: call.id, status: 'failed', error: (error as Error).message });
        }
      }

      logger.info('Queue processing complete', { succeeded: results.succeeded, failed: results.failed });
      return successResponse(results, undefined, undefined, origin);
    }

    // Single call processing
    const singleCallResult = await processOutboundCall(supabase, elevenLabsApiKey, body);
    
    if (!singleCallResult.success) {
      return errorResponse(
        singleCallResult.error || 'Unknown error',
        singleCallResult.status || 500,
        singleCallResult.details ? { details: singleCallResult.details } : undefined,
        origin
      );
    }

    return successResponse(singleCallResult.data, undefined, undefined, origin);

  } catch (error) {
    logger.error('Error in elevenlabs-outbound-call', { error });
    return errorResponse((error as Error).message || 'Internal server error', 500, undefined, origin);
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

    const MAX_RETRY_ATTEMPTS = 3;

    // If processing a queued call, fetch the details
    if (outboundCallId) {
      const { data: queuedCall, error: queueError } = await supabase
        .from('outbound_calls')
        .select('*')
        .eq('id', outboundCallId)
        .eq('status', 'queued')
        .single();

      if (queueError || !queuedCall) {
        logger.error('Queued call not found', { error: queueError });
        return { success: false, error: 'Queued call not found or already processed', status: 404 };
      }

      // Check retry count - if exceeded, mark as permanently failed
      const retryCount = (queuedCall.retry_count as number) || 0;
      if (retryCount >= MAX_RETRY_ATTEMPTS) {
        logger.warn(`Call ${outboundCallId} exceeded max retry attempts (${MAX_RETRY_ATTEMPTS})`, { retryCount });
        await supabase
          .from('outbound_calls')
          .update({
            status: 'failed',
            error_message: `Exceeded maximum retry attempts (${MAX_RETRY_ATTEMPTS})`,
            updated_at: new Date().toISOString()
          })
          .eq('id', outboundCallId);
        return { success: false, error: `Exceeded maximum retry attempts (${MAX_RETRY_ATTEMPTS})`, status: 400 };
      }

      // Validate phone number early - skip invalid numbers immediately
      if (!queuedCall.phone_number || 
          queuedCall.phone_number.includes('object') ||
          queuedCall.phone_number.length < 10) {
        logger.error('Invalid phone number in queued call', { phone: queuedCall.phone_number });
        await supabase
          .from('outbound_calls')
          .update({
            status: 'failed',
            error_message: 'Invalid phone number format',
            updated_at: new Date().toISOString()
          })
          .eq('id', outboundCallId);
        return { success: false, error: 'Invalid phone number format', status: 400 };
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

    // Fetch application with full context if we have an application_id
    let application: Record<string, unknown> | null = null;
    let jobListing: Record<string, unknown> | null = null;
    let organization: Record<string, unknown> | null = null;
    
    if (applicationId) {
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
        logger.error('Application not found', { error: appError });
        return { success: false, error: 'Application not found', status: 404 };
      }

      application = appData;
      phoneNumber = phoneNumber || application.phone as string;
      metadata.applicant_name = `${application.first_name || ''} ${application.last_name || ''}`.trim();
      
      if (application.job_listing_id) {
        const { data: jobData, error: jobError } = await supabase
          .from('job_listings')
          .select(`
            id, title, job_title, job_summary, location, city, state,
            salary_min, salary_max, salary_type, job_type, experience_required,
            organization_id, client_id
          `)
          .eq('id', application.job_listing_id)
          .single();
        
        if (!jobError && jobData) {
          jobListing = jobData;
          
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

    // Get organization ID and client ID from job listing
    let organizationId: string | null = null;
    let clientId: string | null = null;
    if (jobListing?.organization_id) {
      organizationId = jobListing.organization_id as string;
      clientId = (jobListing.client_id as string) || null;
    } else if (application?.job_listing_id) {
      const { data: jl } = await supabase
        .from('job_listings')
        .select('organization_id, client_id')
        .eq('id', application.job_listing_id)
        .single();
      
      organizationId = jl?.organization_id || null;
      clientId = jl?.client_id || null;
    }

    // Find voice agent if not specified - prefer client-specific agents
    if (!voiceAgentId && organizationId) {
      // First try to find a client-specific agent
      if (clientId) {
        const { data: clientAgent } = await supabase
          .from('voice_agents')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('client_id', clientId)
          .eq('is_outbound_enabled', true)
          .eq('is_active', true)
          .not('agent_phone_number_id', 'is', null)
          .limit(1)
          .single();
        
        if (clientAgent) {
          voiceAgentId = clientAgent.id;
          logger.info('Found client-specific outbound agent', { clientId, voiceAgentId });
        }
      }
      
      // Fall back to organization-level agent (client_id is null)
      if (!voiceAgentId) {
        const { data: orgAgent } = await supabase
          .from('voice_agents')
          .select('id')
          .eq('organization_id', organizationId)
          .is('client_id', null)
          .eq('is_outbound_enabled', true)
          .eq('is_active', true)
          .not('agent_phone_number_id', 'is', null)
          .limit(1)
          .single();
        
        if (orgAgent) {
          voiceAgentId = orgAgent.id;
          logger.info('Using organization-level outbound agent', { organizationId, voiceAgentId });
        }
      }
      
      // Final fallback - platform default
      if (!voiceAgentId) {
        const { data: platformAgent } = await supabase
          .from('voice_agents')
          .select('id')
          .eq('is_platform_default', true)
          .eq('is_outbound_enabled', true)
          .eq('is_active', true)
          .not('agent_phone_number_id', 'is', null)
          .limit(1)
          .single();
        
        if (platformAgent) {
          voiceAgentId = platformAgent.id;
          logger.info('Using platform default outbound agent', { voiceAgentId });
        }
      }
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
      logger.error('Voice agent not found', { error: agentError });
      return { success: false, error: 'Voice agent not found', status: 404 };
    }

    if (!voiceAgent.agent_phone_number_id) {
      return { success: false, error: 'Voice agent does not have a phone number configured', status: 400 };
    }

    // Create or update outbound call record
    let callRecord;
    if (outboundCallId) {
      const { data: updated, error: updateError } = await supabase
        .from('outbound_calls')
        .update({ status: 'initiating', updated_at: new Date().toISOString() })
        .eq('id', outboundCallId)
        .select()
        .single();

      if (updateError) {
        logger.error('Failed to update call record', { error: updateError });
      }
      callRecord = updated;
    } else {
      // Check for existing queued call for this application
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
          logger.info(`Found existing queued call ${existingQueued.id} for application ${applicationId}, updating instead`);
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
            logger.error('Failed to update existing queued call', { error: updateError });
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
          logger.error('Failed to create call record', { error: insertError });
        }
        callRecord = newCall;
      }
    }

    // Build dynamic variables for ElevenLabs agent context
    const dynamicVariables = buildDynamicVariables(application, jobListing, organization, metadata);
    logger.info('Dynamic variables for ElevenLabs', { variables: dynamicVariables });

    // Make ElevenLabs outbound call API request
    logger.info('Initiating ElevenLabs outbound call', { phone: normalizedPhone });
    
    const conversationInitData: Record<string, unknown> = {
      dynamic_variables: dynamicVariables
    };

    const elevenLabsPayload: Record<string, unknown> = {
      agent_id: voiceAgent.elevenlabs_agent_id,
      agent_phone_number_id: voiceAgent.agent_phone_number_id,
      to_number: `+1${normalizedPhone}`,
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
    logger.info('ElevenLabs response', { status: elevenLabsResponse.status, body: responseText });

    if (!elevenLabsResponse.ok) {
      logger.error('ElevenLabs API call failed', { 
        status: elevenLabsResponse.status, 
        response: responseText,
        call_id: callRecord?.id 
      });

      if (callRecord) {
        // Increment retry count and keep as queued for transient errors (5xx), fail for permanent errors (4xx)
        const isTransientError = elevenLabsResponse.status >= 500 && elevenLabsResponse.status < 600;
        const currentRetryCount = (callRecord.retry_count as number) || 0;
        
        if (isTransientError && currentRetryCount < MAX_RETRY_ATTEMPTS - 1) {
          // Keep as queued for retry, increment retry count
          await supabase
            .from('outbound_calls')
            .update({
              status: 'queued',
              retry_count: currentRetryCount + 1,
              error_message: `Attempt ${currentRetryCount + 1} failed: ${responseText.substring(0, 500)}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', callRecord.id);
          logger.info(`Call ${callRecord.id} will be retried (attempt ${currentRetryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
        } else {
          // Permanent failure
          await supabase
            .from('outbound_calls')
            .update({
              status: 'failed',
              retry_count: currentRetryCount + 1,
              error_message: `ElevenLabs API error (${elevenLabsResponse.status}): ${responseText.substring(0, 500)}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', callRecord.id);
        }
      }

      return { success: false, error: 'Failed to initiate outbound call', details: responseText, status: elevenLabsResponse.status };
    }

    let elevenLabsData: ElevenLabsOutboundResponse;
    try {
      elevenLabsData = JSON.parse(responseText);
    } catch {
      elevenLabsData = { status: 'initiated' };
    }

    // Normalize callSid (ElevenLabs returns camelCase "callSid", not snake_case)
    const callSid = elevenLabsData.callSid || elevenLabsData.call_sid || null;

    // Update call record with success
    if (callRecord) {
      await supabase
        .from('outbound_calls')
        .update({
          status: 'initiated',
          call_sid: callSid,
          elevenlabs_conversation_id: elevenLabsData.conversation_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', callRecord.id);
    }

    logger.info('Outbound call initiated successfully', { call_sid: callSid, conversation_id: elevenLabsData.conversation_id });

    return {
      success: true,
      data: {
        success: true,
        call_id: callRecord?.id,
        call_sid: callSid,
        conversation_id: elevenLabsData.conversation_id,
        phone_number: normalizedPhone,
        message: 'Outbound call initiated successfully'
      }
    };

  } catch (error) {
    logger.error('Error in processOutboundCall', { error });
    return { success: false, error: (error as Error).message || 'Internal server error', status: 500 };
  }
}

// Normalize US phone number to 10 digits
function normalizePhoneNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.substring(1);
  }
  
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
  const over21 = (application?.over_21 as string) || (application?.age as string);
  vars.over_21_status = (over21 === 'Yes' || over21 === 'yes' || over21 === 'true' || over21 === '1') ? 'yes' : 'unknown';
  
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
  
  // Business hours context for agent after-hours logic (CST = America/Chicago)
  const nowCST = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const hour = nowCST.getHours();
  const minute = nowCST.getMinutes();
  const currentTimeCST = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  const dayOfWeek = nowCST.getDay(); // 0=Sun, 6=Sat
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isWithinBusinessHours = isWeekday && (hour > 9 || (hour === 9 && minute >= 0)) && (hour < 16 || (hour === 16 && minute < 30));
  
  vars.is_after_hours = isWithinBusinessHours ? 'no' : 'yes';
  vars.current_time_cst = currentTimeCST;
  vars.is_weekend = !isWeekday ? 'yes' : 'no';
  vars.business_hours_note = isWithinBusinessHours 
    ? 'Currently within business hours (9:00 AM - 4:30 PM CST). Recruiter transfer is available.'
    : 'Currently outside business hours (9:00 AM - 4:30 PM CST). Do NOT attempt to transfer to a recruiter. Instead, let the driver know a recruiter will call them back after 9 AM CST on the next business day.';

  // Job context inference
  vars.job_requires_cdl = inferCDLRequirement(jobListing);
  vars.job_cdl_class = inferCDLClass(jobListing);
  vars.job_requires_hazmat = inferHazmatRequirement(jobListing);
  vars.job_requires_tanker = inferTankerRequirement(jobListing);
  vars.job_is_entry_level = inferEntryLevel(jobListing);
  vars.job_is_local = inferLocalRoute(jobListing);
  vars.job_is_otr = inferOTR(jobListing);
  vars.job_is_team = inferTeamDriving(jobListing);
  vars.job_freight_type = inferFreightType(jobListing);
  
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

// Job requirement inference functions
function inferCDLRequirement(jobListing: Record<string, unknown> | null): string {
  if (!jobListing) return 'unknown';
  const title = ((jobListing?.title || jobListing?.job_title) as string || '').toLowerCase();
  const summary = (jobListing?.job_summary as string || '').toLowerCase();
  const combined = `${title} ${summary}`;
  if (combined.includes('cdl') || combined.includes('commercial driver')) return 'yes';
  if (combined.includes('no cdl') || combined.includes('non-cdl') || combined.includes('non cdl')) return 'no';
  return 'unknown';
}

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

function inferHazmatRequirement(jobListing: Record<string, unknown> | null): string {
  if (!jobListing) return 'no';
  const combined = `${(jobListing?.title || jobListing?.job_title) as string || ''} ${jobListing?.job_summary || ''}`.toLowerCase();
  return (combined.includes('hazmat') || combined.includes('hazardous')) ? 'yes' : 'no';
}

function inferTankerRequirement(jobListing: Record<string, unknown> | null): string {
  if (!jobListing) return 'no';
  const combined = `${(jobListing?.title || jobListing?.job_title) as string || ''} ${jobListing?.job_summary || ''}`.toLowerCase();
  return (combined.includes('tanker') || combined.includes('fuel') || combined.includes('liquid bulk')) ? 'yes' : 'no';
}

function inferEntryLevel(jobListing: Record<string, unknown> | null): string {
  if (!jobListing) return 'no';
  const combined = `${(jobListing?.title || jobListing?.job_title) as string || ''} ${jobListing?.job_summary || ''}`.toLowerCase();
  if (combined.includes('training') || combined.includes('no experience') || 
      combined.includes('entry level') || combined.includes('entry-level') ||
      combined.includes('will train')) return 'yes';
  return 'no';
}

function inferLocalRoute(jobListing: Record<string, unknown> | null): string {
  if (!jobListing) return 'no';
  const combined = `${(jobListing?.title || jobListing?.job_title) as string || ''} ${jobListing?.job_summary || ''} ${jobListing?.job_type || ''}`.toLowerCase();
  return (combined.includes('local') || combined.includes('home daily')) ? 'yes' : 'no';
}

function inferOTR(jobListing: Record<string, unknown> | null): string {
  if (!jobListing) return 'no';
  const combined = `${(jobListing?.title || jobListing?.job_title) as string || ''} ${jobListing?.job_summary || ''} ${jobListing?.job_type || ''}`.toLowerCase();
  return (combined.includes('otr') || combined.includes('over the road') || combined.includes('regional')) ? 'yes' : 'no';
}

function inferTeamDriving(jobListing: Record<string, unknown> | null): string {
  if (!jobListing) return 'no';
  const combined = `${(jobListing?.title || jobListing?.job_title) as string || ''} ${jobListing?.job_summary || ''}`.toLowerCase();
  return combined.includes('team') ? 'yes' : 'no';
}

function inferFreightType(jobListing: Record<string, unknown> | null): string {
  if (!jobListing) return 'general';
  const combined = `${(jobListing?.title || jobListing?.job_title) as string || ''} ${jobListing?.job_summary || ''}`.toLowerCase();
  if (combined.includes('flatbed')) return 'flatbed';
  if (combined.includes('reefer') || combined.includes('refrigerated')) return 'reefer';
  if (combined.includes('dry van')) return 'dry van';
  if (combined.includes('tanker') || combined.includes('fuel')) return 'tanker';
  if (combined.includes('ltl')) return 'LTL';
  if (combined.includes('dedicated')) return 'dedicated';
  if (combined.includes('intermodal')) return 'intermodal';
  return 'general';
}
