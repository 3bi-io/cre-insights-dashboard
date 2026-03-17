import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.50.0";
import { createLogger } from "../_shared/logger.ts";
import { getCorsHeaders, handleCorsPreflightIfNeeded } from "../_shared/cors-config.ts";

const logger = createLogger('elevenlabs-conversations');

serve(async (req) => {
  const preflightResponse = handleCorsPreflightIfNeeded(req);
  if (preflightResponse) return preflightResponse;

  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Parse request body first to check action
    const body = await req.json();
    const { action, agentId, conversationId } = body;

    // Admin actions that can use API key auth instead of user JWT
    const adminActions = ['sync_single_conversation', 'sync_and_create_applications', 'audit_agents'];
    const isAdminAction = adminActions.includes(action);
    
    // Client with service role for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // For non-admin actions, require user authentication
    if (!isAdminAction) {
      const supabaseAuth = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: req.headers.get('Authorization')! },
          },
        }
      );

      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (!user) {
        throw new Error('Unauthorized');
      }
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    switch (action) {
      case 'list_conversations': {
        // Fetch conversations from ElevenLabs API
        const response = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${agentId}`,
          {
            headers: {
              'xi-api-key': ELEVENLABS_API_KEY,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          // Handle agent not found gracefully
          if (response.status === 404 || errorText.includes('document_not_found')) {
            logger.warn('Agent not found in ElevenLabs', { agentId });
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: 'agent_not_found',
                message: `Agent ${agentId} was not found in ElevenLabs. It may have been deleted or the ID is incorrect.`,
                conversations: { conversations: [] }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          throw new Error(`ElevenLabs API error: ${errorText}`);
        }

        const conversations = await response.json();

        // Get the voice_agent record to find organization_id and voice_agent_id
        const { data: voiceAgent } = await supabase
          .from('voice_agents')
          .select('id, organization_id')
          .eq('elevenlabs_agent_id', agentId)
          .single();

        if (!voiceAgent) {
          throw new Error(`Voice agent not found for agent ID: ${agentId}`);
        }

        // Verify user has access to this agent's organization
        const supabaseAuth = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );
        const { data: { user } } = await supabaseAuth.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();
          
          // Check if super_admin (bypass org check)
          const { data: roleData } = await supabase.rpc('get_current_user_role', { user_uuid: user.id });
          const isSuperAdmin = roleData === 'super_admin';
          
          if (!isSuperAdmin && profile?.organization_id !== voiceAgent.organization_id) {
            logger.warn('Unauthorized conversation access attempt', { 
              agentId, 
              agentOrg: voiceAgent.organization_id?.substring(0, 8),
              userOrg: profile?.organization_id?.substring(0, 8)
            });
            throw new Error('Access denied: You do not have permission to access this agent');
          }
        }

        // Store conversations in database
        let syncedCount = 0;
        for (const conv of conversations.conversations || []) {
          const { error: upsertError } = await supabase
            .from('elevenlabs_conversations')
            .upsert({
              conversation_id: conv.conversation_id,
              agent_id: agentId,
              voice_agent_id: voiceAgent.id,
              organization_id: voiceAgent.organization_id,
              status: conv.status || 'completed',
              started_at: conv.start_time,
              ended_at: conv.end_time,
              duration_seconds: conv.duration,
              metadata: conv.metadata || {},
            }, {
              onConflict: 'conversation_id'
            });
          
          if (upsertError) {
            logger.error('Failed to upsert conversation', upsertError, { conversationId: conv.conversation_id });
          } else {
            syncedCount++;
          }
        }

        logger.info('Synced conversations', { agentId, syncedCount });

        return new Response(
          JSON.stringify({ 
            success: true, 
            conversations,
            message: `Successfully synced ${syncedCount} conversation(s)` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_transcript': {
        // Fetch transcript from ElevenLabs API
        const response = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
          {
            headers: {
              'xi-api-key': ELEVENLABS_API_KEY,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          // Handle "conversation not found" gracefully
          if (response.status === 404 || errorText.includes('conversation_history_not_found') || errorText.includes('document_not_found')) {
            logger.warn('Conversation not found in ElevenLabs', { conversationId });
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: 'transcript_not_found',
                message: 'Transcript not available - conversation may have been deleted from ElevenLabs or history not retained.',
                transcript: { transcript: [] }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          throw new Error(`ElevenLabs API error: ${errorText}`);
        }

        const data = await response.json();

        // Get the conversation record
        const { data: conversation } = await supabase
          .from('elevenlabs_conversations')
          .select('id')
          .eq('conversation_id', conversationId)
          .single();

        if (conversation && data.transcript && data.transcript.length > 0) {
          // Store transcript messages using upsert to prevent duplicates
          for (let i = 0; i < data.transcript.length; i++) {
            const msg = data.transcript[i];
            const { error: upsertError } = await supabase
              .from('elevenlabs_transcripts')
              .upsert({
                conversation_id: conversation.id,
                speaker: msg.role || msg.speaker,
                message: msg.message || msg.text,
                sequence_number: i,
                timestamp: msg.timestamp || new Date().toISOString(),
                confidence_score: msg.confidence,
                metadata: msg.metadata || {},
              }, {
                onConflict: 'conversation_id,sequence_number',
                ignoreDuplicates: false
              });
            
            if (upsertError) {
              logger.error('Failed to upsert transcript message', upsertError, { sequenceNumber: i });
            }
          }
          logger.info('Stored transcript messages', { conversationId, count: data.transcript.length });
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            transcript: data,
            message: data.transcript?.length > 0 
              ? `Loaded ${data.transcript.length} transcript messages` 
              : 'No transcript messages found'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_audio': {
        // Fetch audio recording from ElevenLabs API
        const response = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`,
          {
            headers: {
              'xi-api-key': ELEVENLABS_API_KEY,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${await response.text()}`);
        }

        const audioBuffer = await response.arrayBuffer();
        
        // Get the conversation record
        const { data: conversation } = await supabase
          .from('elevenlabs_conversations')
          .select('id')
          .eq('conversation_id', conversationId)
          .single();

        if (conversation) {
          // Store audio reference
          await supabase
            .from('elevenlabs_audio')
            .insert({
              conversation_id: conversation.id,
              audio_url: `conversations/${conversationId}/audio.mp3`,
              file_size_bytes: audioBuffer.byteLength,
              format: 'mp3',
            });
        }

        return new Response(audioBuffer, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': `attachment; filename="conversation-${conversationId}.mp3"`,
          },
        });
      }

      case 'sync_single_conversation': {
        // Manually sync a specific conversation by ID (even if not in DB)
        if (!conversationId) {
          throw new Error('conversationId is required for sync_single_conversation');
        }

        const response = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
          {
            headers: {
              'xi-api-key': ELEVENLABS_API_KEY,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 404 || errorText.includes('document_not_found')) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'conversation_not_found',
                message: `Conversation ${conversationId} not found in ElevenLabs`,
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          throw new Error(`ElevenLabs API error: ${errorText}`);
        }

        const data = await response.json();
        
        // Extract data collection results for inspection
        const dataCollectionResults = data.analysis?.data_collection_results || {};
        const collectedFields = Object.keys(dataCollectionResults);
        
        // Expected fields for inbound applications
        const expectedFields = [
          'GivenName', 'FamilyName', 'PostalCode', 'Class_A_CDL',
          'Class_A_CDL_Experience', 'DriverType', 'PrimaryPhone',
          'InternetEmailAddress', 'CanPassDrug', 'Veteran_Status', 'consentGiven'
        ];
        
        const missingFields = expectedFields.filter(f => !collectedFields.includes(f));
        const completeness = `${expectedFields.length - missingFields.length}/${expectedFields.length}`;

        logger.info('Conversation data collection', {
          conversationId,
          collectedFields,
          missingFields,
          completeness
        });

        return new Response(
          JSON.stringify({
            success: true,
            conversation: {
              id: data.conversation_id,
              agent_id: data.agent_id,
              status: data.status,
              duration_seconds: data.call_duration_secs,
              started_at: data.start_time,
              ended_at: data.end_time,
            },
            data_collection: {
              results: dataCollectionResults,
              collected_fields: collectedFields,
              missing_fields: missingFields,
              completeness,
            },
            analysis: {
              transcript_summary: data.analysis?.transcript_summary,
              evaluation_criteria_results: data.analysis?.evaluation_criteria_results,
            },
            transcript_message_count: data.transcript?.length || 0,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync_and_create_applications': {
        // Sync conversations from ElevenLabs and create applications for any missing
        if (!agentId) {
          throw new Error('agentId is required for sync_and_create_applications');
        }

        // Get voice agent configuration
        const { data: voiceAgent } = await supabase
          .from('voice_agents')
          .select('id, organization_id, client_id, agent_name')
          .eq('elevenlabs_agent_id', agentId)
          .eq('is_active', true)
          .single();

        if (!voiceAgent) {
          throw new Error(`Voice agent not found or inactive: ${agentId}`);
        }

        // Fetch conversations from ElevenLabs
        const listResponse = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${agentId}&page_size=100`,
          {
            headers: { 'xi-api-key': ELEVENLABS_API_KEY },
          }
        );

        if (!listResponse.ok) {
          throw new Error(`Failed to fetch conversations: ${await listResponse.text()}`);
        }

        const listData = await listResponse.json();
        const conversations = listData.conversations || [];
        
        logger.info('Found conversations for agent', { agentId, count: conversations.length });

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

        const results = {
          total_conversations: conversations.length,
          already_processed: 0,
          applications_created: 0,
          errors: [] as string[],
        };

        for (const conv of conversations) {
          const convId = conv.conversation_id;

          // Skip if already processed
          if (existingConversationIds.has(convId)) {
            results.already_processed++;
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
              results.errors.push(`${convId}: Failed to fetch details`);
              continue;
            }

            const convData = await convResponse.json();
            const dataCollectionResults = convData.analysis?.data_collection_results || {};
            const transcript = convData.transcript || [];
            const transcriptSummary = convData.analysis?.transcript_summary;

            // Extract application data from data_collection_results
            const getValue = (keys: string[]): string | undefined => {
              for (const key of keys) {
                if (dataCollectionResults[key]) {
                  return String(dataCollectionResults[key]).trim();
                }
              }
              return undefined;
            };

            const firstName = getValue(['GivenName', 'first_name']);
            const lastName = getValue(['FamilyName', 'last_name']);
            const email = getValue(['InternetEmailAddress', 'email']);
            const phone = getValue(['PrimaryPhone', 'phone']);
            const zip = getValue(['PostalCode', 'zip']);

            // Must have at least email or phone to create application
            if (!email && !phone) {
              logger.debug('Skipping conversation - no contact info', { conversationId: convId });
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

            // Find or create job listing
            let jobListingId: string | null = null;
            const { data: activeJob } = await supabase
              .from('job_listings')
              .select('id')
              .eq('organization_id', voiceAgent.organization_id)
              .eq('client_id', voiceAgent.client_id)
              .eq('status', 'active')
              .limit(1)
              .maybeSingle();

            if (activeJob) {
              jobListingId = activeJob.id;
            } else {
              // Fallback to any active job for the org
              const { data: fallbackJob } = await supabase
                .from('job_listings')
                .select('id')
                .eq('organization_id', voiceAgent.organization_id)
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
              cdl: getValue(['Class_A_CDL', 'cdl']),
              exp: getValue(['Class_A_CDL_Experience', 'experience']),
              driver_type: getValue(['DriverType', 'driver_type']),
              drug: getValue(['CanPassDrug', 'drug']),
              veteran: getValue(['Veteran_Status', 'veteran']),
              consent: getValue(['consentGiven', 'consent']),
              source: 'ElevenLabs',
              job_listing_id: jobListingId,
              elevenlabs_call_transcript: transcriptParts.join('\n\n'),
              notes: `--- ElevenLabs Call Info ---\n${callMetadata}`,
              status: 'pending',
              applied_at: convData.start_time || new Date().toISOString(),
            };

            const { error: insertError } = await supabase
              .from('applications')
              .insert(applicationData);

            if (insertError) {
              results.errors.push(`${convId}: ${insertError.message}`);
            } else {
              results.applications_created++;
              logger.info('Created application from conversation', { conversationId: convId, contact: email || phone });
            }

          } catch (err) {
            results.errors.push(`${convId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            agent: {
              name: voiceAgent.agent_name,
              id: agentId,
              organization_id: voiceAgent.organization_id,
              client_id: voiceAgent.client_id,
            },
            results,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'audit_agents': {
        // Audit all active inbound agents for data collection configuration
        const { data: inboundAgents } = await supabase
          .from('voice_agents')
          .select('id, agent_name, elevenlabs_agent_id, organization_id, client_id')
          .eq('is_active', true)
          .eq('is_outbound_enabled', false);

        if (!inboundAgents || inboundAgents.length === 0) {
          return new Response(
            JSON.stringify({
              success: true,
              audit_results: [],
              total_agents: 0,
              message: 'No active inbound agents found',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const expectedFields = [
          'GivenName', 'FamilyName', 'PostalCode', 'Class_A_CDL',
          'Class_A_CDL_Experience', 'DriverType', 'PrimaryPhone',
          'InternetEmailAddress', 'CanPassDrug', 'Veteran_Status', 'consentGiven'
        ];

        const auditResults = [];

        for (const agent of inboundAgents) {
          try {
            // Fetch a recent conversation to check data collection
            const listResponse = await fetch(
              `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${agent.elevenlabs_agent_id}&page_size=1`,
              {
                headers: {
                  'xi-api-key': ELEVENLABS_API_KEY,
                },
              }
            );

            if (!listResponse.ok) {
              auditResults.push({
                agent_name: agent.agent_name,
                agent_id: agent.elevenlabs_agent_id,
                organization_id: agent.organization_id,
                status: 'error',
                error: `API error: ${listResponse.status}`,
                data_collection_status: 'unknown',
                sample_collected_fields: [],
              });
              continue;
            }

            const listData = await listResponse.json();
            const hasConversations = listData.conversations?.length > 0;

            if (!hasConversations) {
              auditResults.push({
                agent_name: agent.agent_name,
                agent_id: agent.elevenlabs_agent_id,
                organization_id: agent.organization_id,
                status: 'no_conversations',
                data_collection_status: 'unknown',
                sample_collected_fields: [],
                message: 'No conversations to analyze',
              });
              continue;
            }

            // Fetch conversation details
            const convResponse = await fetch(
              `https://api.elevenlabs.io/v1/convai/conversations/${listData.conversations[0].conversation_id}`,
              {
                headers: {
                  'xi-api-key': ELEVENLABS_API_KEY,
                },
              }
            );

            if (!convResponse.ok) {
              auditResults.push({
                agent_name: agent.agent_name,
                agent_id: agent.elevenlabs_agent_id,
                organization_id: agent.organization_id,
                status: 'error',
                error: 'Failed to fetch conversation details',
                data_collection_status: 'unknown',
                sample_collected_fields: [],
              });
              continue;
            }

            const convData = await convResponse.json();
            const sampleFields = Object.keys(convData.analysis?.data_collection_results || {});
            const missingFields = expectedFields.filter(f => !sampleFields.includes(f));
            const dataCollectionStatus = sampleFields.length > 0 
              ? (missingFields.length === 0 ? 'complete' : 'partial')
              : 'not_configured';

            auditResults.push({
              agent_name: agent.agent_name,
              agent_id: agent.elevenlabs_agent_id,
              organization_id: agent.organization_id,
              status: 'ok',
              data_collection_status: dataCollectionStatus,
              sample_collected_fields: sampleFields,
              missing_fields: missingFields,
              completeness: `${sampleFields.length}/${expectedFields.length}`,
              sample_conversation_id: listData.conversations[0].conversation_id,
            });
          } catch (err) {
            auditResults.push({
              agent_name: agent.agent_name,
              agent_id: agent.elevenlabs_agent_id,
              organization_id: agent.organization_id,
              status: 'error',
              error: err instanceof Error ? err.message : 'Unknown error',
              data_collection_status: 'unknown',
              sample_collected_fields: [],
            });
          }
        }

        const configuredCount = auditResults.filter(a => 
          a.data_collection_status === 'complete' || a.data_collection_status === 'partial'
        ).length;

        return new Response(
          JSON.stringify({
            success: true,
            audit_results: auditResults,
            total_agents: auditResults.length,
            configured_count: configuredCount,
            not_configured_count: auditResults.filter(a => a.data_collection_status === 'not_configured').length,
            expected_fields: expectedFields,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_audio_stream': {
        // Fetch audio for inline playback (no Content-Disposition: attachment)
        const response = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`,
          {
            headers: {
              'xi-api-key': ELEVENLABS_API_KEY,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${await response.text()}`);
        }

        const audioBuffer = await response.arrayBuffer();
        
        return new Response(audioBuffer, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'audio/mpeg',
          },
        });
      }

      default:
        throw new Error(`Invalid action: ${action}`);
    }
  } catch (error) {
    logger.error('Error', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
