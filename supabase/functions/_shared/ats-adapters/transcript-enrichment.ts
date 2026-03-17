/**
 * Transcript Enrichment Utility
 * Shared helper to fetch and attach outbound call transcripts to application data.
 * Used by both ats-integration (manual re-send) and auto-post-engine (automated flow).
 */

import { SupabaseClient } from 'npm:@supabase/supabase-js@2.50.0';
import { createLogger } from '../logger.ts';

const logger = createLogger('transcript-enrichment');

/**
 * Enrich application data with a call transcript from outbound calls.
 * - Queries outbound_calls for the application (broadened status filter)
 * - Fetches transcript from ElevenLabs API if not cached locally
 * - Stores transcript in elevenlabs_transcripts
 * - Syncs outbound call status to 'completed' if ElevenLabs reports 'done'
 * - Returns enriched appData with `call_transcript` field
 */
export async function enrichWithTranscript(
  supabase: SupabaseClient,
  appData: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const applicationId = appData.id as string;
  if (!applicationId) return appData;

  try {
    // Find outbound call with a conversation_id (any status)
    const { data: outboundCall } = await supabase
      .from('outbound_calls')
      .select('id, elevenlabs_conversation_id, status')
      .eq('application_id', applicationId)
      .in('status', ['completed', 'initiated', 'in_progress'])
      .not('elevenlabs_conversation_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!outboundCall?.elevenlabs_conversation_id) {
      return appData;
    }

    const { data: convo } = await supabase
      .from('elevenlabs_conversations')
      .select('id, conversation_id, metadata')
      .eq('conversation_id', outboundCall.elevenlabs_conversation_id)
      .maybeSingle();

    if (!convo?.id) return appData;

    // Check local transcripts first
    let { data: transcriptMessages } = await supabase
      .from('elevenlabs_transcripts')
      .select('speaker, message, sequence_number')
      .eq('conversation_id', convo.id)
      .order('sequence_number', { ascending: true });

    // Auto-fetch from ElevenLabs API if no local transcripts
    if (!transcriptMessages || transcriptMessages.length === 0) {
      const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
      if (ELEVENLABS_API_KEY) {
        logger.info('No local transcripts, fetching from ElevenLabs API', {
          conversation_id: convo.conversation_id
        });

        try {
          const elResponse = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversations/${convo.conversation_id}`,
            { headers: { 'xi-api-key': ELEVENLABS_API_KEY } }
          );

          if (elResponse.ok) {
            const elData = await elResponse.json();
            const transcript = elData.transcript || [];

            if (transcript.length > 0) {
              const transcriptRows = transcript.map((msg: any, index: number) => ({
                conversation_id: convo.id,
                speaker: msg.role === 'agent' ? 'agent' : 'user',
                message: msg.message || '',
                timestamp: msg.time_in_call_secs
                  ? new Date(new Date(convo.metadata?.start_time || Date.now()).getTime() + msg.time_in_call_secs * 1000).toISOString()
                  : new Date().toISOString(),
                sequence_number: index + 1,
              }));

              const { error: upsertError } = await supabase
                .from('elevenlabs_transcripts')
                .upsert(transcriptRows, { onConflict: 'conversation_id,sequence_number' });

              if (upsertError) {
                logger.warn('Failed to store fetched transcripts', { error: upsertError.message });
              } else {
                logger.info('Stored transcripts from ElevenLabs API', { count: transcriptRows.length });
                transcriptMessages = transcriptRows.map((r: any) => ({
                  speaker: r.speaker,
                  message: r.message,
                  sequence_number: r.sequence_number,
                }));
              }
            }

            // Sync outbound call status
            if (elData.status === 'done' && outboundCall.status !== 'completed') {
              await supabase
                .from('outbound_calls')
                .update({ status: 'completed' })
                .eq('id', outboundCall.id);
              logger.info('Updated outbound call status to completed', { call_id: outboundCall.id });
            }
          } else {
            logger.warn('ElevenLabs API returned error', { status: elResponse.status });
          }
        } catch (apiError) {
          logger.warn('ElevenLabs API call failed', {
            error: apiError instanceof Error ? apiError.message : 'Unknown'
          });
        }
      } else {
        logger.warn('ELEVENLABS_API_KEY not configured, skipping transcript fetch');
      }
    }

    // Build formatted transcript and attach to appData
    if (transcriptMessages && transcriptMessages.length > 0) {
      const formattedTranscript = transcriptMessages
        .map(m => {
          const role = m.speaker === 'agent' ? 'Agent' : 'Caller';
          return `${role}: ${m.message}`;
        })
        .join('\n');
      appData.call_transcript = formattedTranscript;
      logger.info('Attached call transcript', {
        application_id: applicationId,
        message_count: transcriptMessages.length
      });
    }
  } catch (transcriptError) {
    logger.warn('Failed to fetch call transcript', {
      application_id: applicationId,
      error: transcriptError instanceof Error ? transcriptError.message : 'Unknown error'
    });
  }

  return appData;
}
