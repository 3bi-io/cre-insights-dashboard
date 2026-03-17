/**
 * Get Shared Conversation Edge Function
 * Serves voice conversation data publicly via share code
 * No authentication required - data is exposed based on valid share code
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightIfNeeded } from '../_shared/cors-config.ts';
import { createLogger } from '../_shared/logger.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';

const logger = createLogger('get-shared-conversation');

const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');

serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightIfNeeded(req);
  if (preflightResponse) return preflightResponse;

  try {
    const url = new URL(req.url);
    const shareCode = url.searchParams.get('code');

    if (!shareCode) {
      return new Response(
        JSON.stringify({ success: false, error: 'Share code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Fetching shared conversation', { shareCode });

    const supabase = getServiceClient();

    // Get shared conversation info from public view
    const { data: shareInfo, error: shareError } = await supabase
      .from('public_shared_conversation_info')
      .select('*')
      .eq('share_code', shareCode)
      .single();

    if (shareError || !shareInfo) {
      logger.warn('Share code not found or expired', { shareCode, error: shareError?.message });
      return new Response(
        JSON.stringify({ success: false, error: 'Conversation not found or link has expired' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment view count
    await supabase.rpc('increment_share_view_count', { p_share_code: shareCode });

    // Get transcript
    const { data: transcriptData, error: transcriptError } = await supabase
      .from('elevenlabs_transcripts')
      .select('id, speaker, message, timestamp, sequence_number')
      .eq('conversation_id', shareInfo.conversation_id)
      .order('sequence_number', { ascending: true });

    if (transcriptError) {
      logger.error('Error fetching transcript', transcriptError);
    }

    // Process transcript based on hide_caller_info setting
    let transcript = transcriptData || [];
    if (shareInfo.hide_caller_info) {
      transcript = transcript.map((item: any) => ({
        ...item,
        // Redact user messages if hide_caller_info is enabled
        speaker: item.speaker === 'user' ? 'caller' : item.speaker,
      }));
    }

    // Get audio info
    const { data: audioData } = await supabase
      .from('elevenlabs_audio')
      .select('audio_url, format')
      .eq('conversation_id', shareInfo.conversation_id)
      .single();

    // Build audio URL - either proxy through edge function or return direct URL
    let audioUrl = null;
    if (audioData?.audio_url && elevenLabsApiKey) {
      // Create a signed URL for audio streaming via the audio endpoint
      audioUrl = `${supabaseUrl}/functions/v1/get-shared-conversation/audio?code=${shareCode}`;
    }

    // Format response
    const response = {
      success: true,
      conversation: {
        title: shareInfo.custom_title || `Voice Conversation`,
        agent_name: shareInfo.agent_name || 'Voice Agent',
        organization: {
          name: shareInfo.organization_name,
          logo_url: shareInfo.organization_logo,
        },
        started_at: shareInfo.started_at,
        duration_seconds: shareInfo.duration_seconds,
        status: shareInfo.status,
        transcript,
        audio_url: audioUrl,
        hide_caller_info: shareInfo.hide_caller_info,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logger.error('Error processing request', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
