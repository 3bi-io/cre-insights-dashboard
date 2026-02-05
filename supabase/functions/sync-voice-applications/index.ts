import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { createLogger } from "../_shared/logger.ts";
import { normalizeSpokenEmail, isValidEmail } from "../_shared/email-utils.ts";
 import { lookupCityState } from "../_shared/zip-lookup.ts";

const logger = createLogger('sync-voice-applications');

// Only sync conversations that started after this timestamp (prevents re-importing historical data)
const SYNC_CUTOFF_DATE = new Date('2026-01-26T19:00:00Z');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Get all active inbound agents (is_outbound_enabled = false)
    const { data: inboundAgents, error: agentsError } = await supabase
      .from('voice_agents')
      .select('id, agent_name, elevenlabs_agent_id, organization_id, client_id')
      .eq('is_active', true)
      .eq('is_outbound_enabled', false);

    if (agentsError) {
      throw new Error(`Failed to fetch voice agents: ${agentsError.message}`);
    }

    if (!inboundAgents || inboundAgents.length === 0) {
      logger.info('No active inbound agents found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active inbound agents to sync',
          agents_synced: 0,
          applications_created: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Starting sync for inbound agents', { count: inboundAgents.length });

    const syncResults = {
      agents_synced: 0,
      applications_created: 0,
      conversations_processed: 0,
      errors: [] as string[],
      agent_details: [] as Array<{
        agent_name: string;
        agent_id: string;
        conversations: number;
        applications: number;
        error?: string;
      }>,
    };

    for (const agent of inboundAgents) {
      const agentResult = {
        agent_name: agent.agent_name,
        agent_id: agent.elevenlabs_agent_id,
        conversations: 0,
        applications: 0,
        error: undefined as string | undefined,
      };

      try {
        // Fetch conversations from ElevenLabs
        const listResponse = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${agent.elevenlabs_agent_id}&page_size=100`,
          {
            headers: { 'xi-api-key': ELEVENLABS_API_KEY },
          }
        );

        if (!listResponse.ok) {
          const errorText = await listResponse.text();
          agentResult.error = `API error: ${listResponse.status}`;
          syncResults.errors.push(`${agent.agent_name}: ${errorText}`);
          syncResults.agent_details.push(agentResult);
          continue;
        }

        const listData = await listResponse.json();
        const conversations = listData.conversations || [];
        agentResult.conversations = conversations.length;

        if (conversations.length === 0) {
          syncResults.agent_details.push(agentResult);
          syncResults.agents_synced++;
          continue;
        }

        // Get existing applications from this agent to avoid duplicates
        const { data: existingApps } = await supabase
          .from('applications')
          .select('notes')
          .eq('source', 'ElevenLabs')
          .ilike('notes', '%Conversation ID:%');

        const existingConversationIds = new Set(
          (existingApps || [])
            .map(app => {
              const match = (app.notes as string)?.match(/Conversation ID: (conv_[a-z0-9]+)/);
              return match ? match[1] : null;
            })
            .filter(Boolean)
        );

        for (const conv of conversations) {
          const convId = conv.conversation_id;
          syncResults.conversations_processed++;

          // Skip if already processed
          if (existingConversationIds.has(convId)) {
            continue;
          }

          // Skip conversations before cutoff date (prevents re-importing historical data)
          // ElevenLabs uses 'start_time_unix_secs' (Unix timestamp in seconds)
          const convStartUnix = conv.start_time_unix_secs;
          const convStartTime = convStartUnix ? new Date(convStartUnix * 1000) : null;
          
          if (convStartTime && convStartTime < SYNC_CUTOFF_DATE) {
            continue;
          }

          try {
            // Fetch full conversation details
            const convResponse = await fetch(
              `https://api.elevenlabs.io/v1/convai/conversations/${convId}`,
              {
                headers: { 'xi-api-key': ELEVENLABS_API_KEY },
              }
            );

            if (!convResponse.ok) {
              continue;
            }

            const convData = await convResponse.json();
            const dataCollectionResults = convData.analysis?.data_collection_results || {};
            const transcript = convData.transcript || [];
            const transcriptSummary = convData.analysis?.transcript_summary;

            // Extract application data - handle both primitive and object values
            const getValue = (keys: string[], options?: { normalizeEmail?: boolean }): string | undefined => {
              for (const key of keys) {
                const val = dataCollectionResults[key];
                if (val !== undefined && val !== null) {
                  let result: string;
                  
                  // Handle object values (e.g., { value: "string" })
                  if (typeof val === 'object') {
                    const objVal = val as Record<string, unknown>;
                    // Extract actual value, skip if null/undefined to avoid storing JSON strings
                    const extractedValue = objVal.value ?? objVal.answer ?? objVal.text;
                    if (extractedValue === null || extractedValue === undefined) {
                      continue; // Skip to next key instead of returning JSON
                    }
                    result = String(extractedValue).trim();
                  } else {
                    result = String(val).trim();
                  }
                  
                  // Apply email normalization if requested
                  if (options?.normalizeEmail) {
                    const normalized = normalizeSpokenEmail(result);
                    if (normalized && isValidEmail(normalized)) {
                      return normalized;
                    }
                    // If normalization failed but original looks like an email, try it
                    if (isValidEmail(result)) {
                      return result.toLowerCase();
                    }
                    continue; // Skip invalid email, try next key
                  }
                  
                  return result;
                }
              }
              return undefined;
            };

            const firstName = getValue(['GivenName', 'first_name', 'FirstName']);
            const lastName = getValue(['FamilyName', 'last_name', 'LastName']);
            const email = getValue(['InternetEmailAddress', 'email', 'Email'], { normalizeEmail: true });
            const phone = getValue(['PrimaryPhone', 'phone', 'Phone', 'PhoneNumber']);
            const zip = getValue(['PostalCode', 'zip', 'Zip', 'ZipCode']);
 
             // Lookup city/state from ZIP code if available
             const { city, state } = await lookupCityState(zip);

            // Must have at least email or phone to create application
            if (!email && !phone) {
              continue;
            }

            // Format transcript
            const formattedTranscript = transcript
              .map((entry: { role: string; message: string }) =>
                `${entry.role === 'agent' ? 'Agent' : 'Caller'}: ${entry.message}`
              )
              .join('\n');

            const transcriptParts: string[] = [];
            if (transcriptSummary) {
              transcriptParts.push(`=== Summary ===\n${transcriptSummary}`);
            }
            transcriptParts.push(`=== Full Transcript ===\n${formattedTranscript}`);

            // Build notes
            const callDuration = convData.call_duration_secs;
            const callStatus = convData.status;
            const callMetadata = [
              `Conversation ID: ${convId}`,
              callDuration ? `Call Duration: ${Math.floor(callDuration / 60)}m ${Math.round(callDuration % 60)}s` : null,
              callStatus ? `Call Status: ${callStatus}` : null,
            ].filter(Boolean).join('\n');

            // Find job listing - prioritize client-specific, then org-level
            let jobListingId: string | null = null;
            
            if (agent.client_id) {
              const { data: clientJob } = await supabase
                .from('job_listings')
                .select('id')
                .eq('organization_id', agent.organization_id)
                .eq('client_id', agent.client_id)
                .eq('status', 'active')
                .limit(1)
                .maybeSingle();

              if (clientJob) {
                jobListingId = clientJob.id;
              }
            }

            if (!jobListingId) {
              // Fallback to any active job for the org
              const { data: fallbackJob } = await supabase
                .from('job_listings')
                .select('id')
                .eq('organization_id', agent.organization_id)
                .eq('status', 'active')
                .limit(1)
                .maybeSingle();

              if (fallbackJob) {
                jobListingId = fallbackJob.id;
              }
            }

            // Create application
            const applicationData = {
              first_name: firstName,
              last_name: lastName,
              full_name: firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName,
              applicant_email: email,
              phone: phone,
              zip: zip,
               city: city || undefined,
               state: state || undefined,
              cdl: getValue(['Class_A_CDL', 'cdl']),
              exp: getValue(['Class_A_CDL_Experience', 'experience']),
              driver_type: getValue(['DriverType', 'driver_type']),
              drug: getValue(['CanPassDrug', 'drug']),
              veteran: getValue(['Veteran_Status', 'veteran']),
              consent: getValue(['consentGiven', 'consent']),
               over_21: getValue(['Over21', 'over_21', 'AgeVerification']),
               hazmat_endorsement: getValue(['Hazmat', 'hazmat_endorsement', 'HazmatEndorsement']),
               can_pass_drug_test: getValue(['CanPassDrug', 'can_pass_drug_test']),
               work_authorization: getValue(['WorkAuthorization', 'work_authorization']),
               cdl_class: getValue(['CDLClass', 'cdl_class', 'LicenseClass']),
              source: 'ElevenLabs',
              job_listing_id: jobListingId,
              elevenlabs_call_transcript: transcriptParts.join('\n\n'),
              notes: `--- ElevenLabs Call Info ---\n${callMetadata}\nAgent: ${agent.agent_name}`,
              status: 'pending',
              applied_at: convData.start_time || new Date().toISOString(),
            };

            const { error: insertError } = await supabase
              .from('applications')
              .insert(applicationData);

            if (!insertError) {
              agentResult.applications++;
              syncResults.applications_created++;
              logger.info('Created application from conversation', { 
                conversationId: convId, 
                agentName: agent.agent_name,
                contact: email || phone 
              });
            }

          } catch (err) {
            // Continue with next conversation on individual errors
          }
        }

        syncResults.agents_synced++;
        syncResults.agent_details.push(agentResult);

      } catch (err) {
        agentResult.error = err instanceof Error ? err.message : 'Unknown error';
        syncResults.errors.push(`${agent.agent_name}: ${agentResult.error}`);
        syncResults.agent_details.push(agentResult);
      }
    }

    const duration = Date.now() - startTime;
    logger.info('Sync completed', {
      agentsSynced: syncResults.agents_synced,
      applicationsCreated: syncResults.applications_created,
      conversationsProcessed: syncResults.conversations_processed,
      durationMs: duration,
    });

    return new Response(
      JSON.stringify({
        success: true,
        ...syncResults,
        duration_ms: duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Sync failed', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        duration_ms: duration,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
