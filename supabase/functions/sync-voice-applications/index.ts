import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { createLogger } from "../_shared/logger.ts";
import { normalizeSpokenEmail, isValidEmail } from "../_shared/email-utils.ts";
import { lookupCityState } from "../_shared/zip-lookup.ts";
import { extractFromTranscript, ExtractedData } from "../_shared/transcript-parser.ts";
import { normalizePhone, containsSpokenDigits } from "../_shared/phone-utils.ts";

const logger = createLogger('sync-voice-applications');

// Only sync conversations that started after this timestamp (prevents re-importing historical data)
const SYNC_CUTOFF_DATE = new Date('2026-01-26T19:00:00Z');

// Deduplication window - skip if same contact applied within this period
const DEDUP_WINDOW_HOURS = 24;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Check if a duplicate application exists within the dedup window
 * Matches by email or normalized phone within the same job listing (or org if no job listing)
 */
async function isDuplicate(
  supabase: ReturnType<typeof createClient>,
  email: string | undefined,
  phone: string | null,
  jobListingId: string | null,
  organizationId: string | null,
): Promise<{ isDup: boolean; existingId?: string }> {
  if (!email && !phone) return { isDup: false };

  const cutoff = new Date(Date.now() - DEDUP_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  // Check by email first
  if (email) {
    let query = supabase
      .from('applications')
      .select('id')
      .eq('applicant_email', email)
      .gte('created_at', cutoff)
      .limit(1)
      .maybeSingle();

    if (jobListingId) {
      query = query.eq('job_listing_id', jobListingId);
    }

    const { data } = await query;
    if (data) return { isDup: true, existingId: data.id };
  }

  // Check by phone
  if (phone) {
    let query = supabase
      .from('applications')
      .select('id')
      .eq('phone', phone)
      .gte('created_at', cutoff)
      .limit(1)
      .maybeSingle();

    if (jobListingId) {
      query = query.eq('job_listing_id', jobListingId);
    }

    const { data } = await query;
    if (data) return { isDup: true, existingId: data.id };
  }

  return { isDup: false };
}

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
      duplicates_skipped: 0,
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

        // Get existing applications from this agent to avoid duplicates by conversation_id
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

          // Skip if already processed by conversation_id
          if (existingConversationIds.has(convId)) {
            continue;
          }

          // Skip conversations before cutoff date
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
                  
                  if (typeof val === 'object') {
                    const objVal = val as Record<string, unknown>;
                    const extractedValue = objVal.value ?? objVal.answer ?? objVal.text;
                    if (extractedValue === null || extractedValue === undefined) {
                      continue;
                    }
                    result = String(extractedValue).trim();
                  } else {
                    result = String(val).trim();
                  }
                  
                  if (options?.normalizeEmail) {
                    const normalized = normalizeSpokenEmail(result);
                    if (normalized && isValidEmail(normalized)) {
                      return normalized;
                    }
                    if (isValidEmail(result)) {
                      return result.toLowerCase();
                    }
                    continue;
                  }
                  
                  return result;
                }
              }
              return undefined;
            };

            // Expanded field aliases
            const firstName = getValue(['GivenName', 'first_name', 'FirstName', 'given_name', 'firstName', 'name', 'caller_first_name']);
            const lastName = getValue(['FamilyName', 'last_name', 'LastName', 'family_name', 'lastName', 'caller_last_name']);
            const email = getValue(['InternetEmailAddress', 'email', 'Email', 'email_address', 'emailAddress', 'caller_email'], { normalizeEmail: true });
            const rawPhone = getValue(['PrimaryPhone', 'phone', 'Phone', 'PhoneNumber', 'phone_number', 'phoneNumber', 'cell', 'mobile', 'caller_phone']);
            const zipFromData = getValue(['PostalCode', 'zip', 'Zip', 'ZipCode', 'zip_code', 'zipCode', 'postal_code', 'postalCode']);

            // Format transcript for fallback parsing
            const formattedTranscript = transcript
              .map((entry: { role: string; message: string }) =>
                `${entry.role === 'agent' ? 'Agent' : 'Caller'}: ${entry.message}`
              )
              .join('\n');

            const fallbackData: ExtractedData = extractFromTranscript(formattedTranscript);

            // Normalize phone - handle spoken digits
            const phoneRaw = rawPhone || (fallbackData.phone ? fallbackData.phone : undefined);
            const normalizedPhone = normalizePhone(phoneRaw);

            const zip = zipFromData || fallbackData.zip;
            const { city, state } = await lookupCityState(zip);

            const finalEmail = email || fallbackData.email;
            if (!finalEmail && !normalizedPhone) {
              continue;
            }

            // Find job listing
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

            // Deduplication check - skip if same email/phone applied recently
            const { isDup, existingId } = await isDuplicate(
              supabase, finalEmail, normalizedPhone, jobListingId, agent.organization_id
            );
            if (isDup) {
              logger.info('Skipping duplicate application', {
                conversationId: convId,
                existingApplicationId: existingId,
                contact: finalEmail || normalizedPhone,
              });
              syncResults.duplicates_skipped++;
              continue;
            }

            // CDL and qualification fields
            const cdlValue = getValue(['Class_A_CDL', 'cdl', 'has_cdl', 'CDL', 'cdl_status', 'hasCDL', 'class_a_cdl']) || fallbackData.cdl;
            const expValue = getValue(['Class_A_CDL_Experience', 'experience', 'exp', 'months_experience', 'driving_experience', 'cdl_experience', 'experienceMonths']) || fallbackData.exp;
            const drugValue = getValue(['CanPassDrug', 'drug', 'drug_test', 'can_pass_drug_test', 'drugTest', 'passedDrugTest']) || fallbackData.drug;
            const veteranValue = getValue(['Veteran_Status', 'veteran', 'is_veteran', 'military', 'served_military', 'veteranStatus']) || fallbackData.veteran;
            const consentValue = getValue(['consentGiven', 'consent', 'privacy_consent', 'agreed_privacy', 'privacyPolicy']) || fallbackData.consent;
            const over21Value = getValue(['Over21', 'over_21', 'AgeVerification', 'is_over_21', 'age_verified', 'atLeast21']) || fallbackData.over_21;
            const driverTypeValue = getValue(['DriverType', 'driver_type', 'driverType', 'employment_type', 'position_type']) || fallbackData.driver_type;

            const transcriptParts: string[] = [];
            if (transcriptSummary) {
              transcriptParts.push(`=== Summary ===\n${transcriptSummary}`);
            }
            transcriptParts.push(`=== Full Transcript ===\n${formattedTranscript}`);

            const callDuration = convData.call_duration_secs;
            const callStatus = convData.status;
            const callMetadata = [
              `Conversation ID: ${convId}`,
              callDuration ? `Call Duration: ${Math.floor(callDuration / 60)}m ${Math.round(callDuration % 60)}s` : null,
              callStatus ? `Call Status: ${callStatus}` : null,
            ].filter(Boolean).join('\n');

            const applicationData = {
              first_name: firstName,
              last_name: lastName,
              full_name: firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName,
              applicant_email: finalEmail,
              phone: normalizedPhone || rawPhone,
              zip: zip,
              city: city || undefined,
              state: state || undefined,
              cdl: cdlValue,
              exp: expValue,
              driver_type: driverTypeValue,
              drug: drugValue,
              veteran: veteranValue,
              consent: consentValue,
              over_21: over21Value,
              hazmat_endorsement: getValue(['Hazmat', 'hazmat_endorsement', 'HazmatEndorsement', 'hazmat', 'hasHazmat']),
              can_pass_drug_test: drugValue,
              work_authorization: getValue(['WorkAuthorization', 'work_authorization', 'workAuthorization', 'authorized_to_work']),
              cdl_class: getValue(['CDLClass', 'cdl_class', 'LicenseClass', 'license_class', 'cdlClass']),
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
                contact: finalEmail || normalizedPhone 
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
      duplicatesSkipped: syncResults.duplicates_skipped,
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
