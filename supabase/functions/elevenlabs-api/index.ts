import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'ElevenLabs API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, ...params } = await req.json();
    console.log('ElevenLabs API action:', action);

    const headers = {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    };

    switch (action) {
      case 'test_connection': {
        const response = await fetch(`${ELEVENLABS_API_BASE}/user`, { headers });
        if (!response.ok) {
          const error = await response.text();
          return new Response(
            JSON.stringify({ success: false, error: `API Error: ${error}` }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const user = await response.json();
        return new Response(
          JSON.stringify({ success: true, user }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_subscription': {
        const response = await fetch(`${ELEVENLABS_API_BASE}/user/subscription`, { headers });
        if (!response.ok) {
          throw new Error(`API Error: ${await response.text()}`);
        }
        const subscription = await response.json();
        return new Response(
          JSON.stringify({ success: true, subscription }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_voices': {
        const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, { headers });
        if (!response.ok) {
          throw new Error(`API Error: ${await response.text()}`);
        }
        const data = await response.json();
        return new Response(
          JSON.stringify({ success: true, voices: data.voices }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_voice': {
        const { voiceId } = params;
        if (!voiceId) throw new Error('voiceId is required');
        
        const response = await fetch(`${ELEVENLABS_API_BASE}/voices/${voiceId}`, { headers });
        if (!response.ok) {
          throw new Error(`API Error: ${await response.text()}`);
        }
        const voice = await response.json();
        return new Response(
          JSON.stringify({ success: true, voice }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'text_to_speech': {
        const { voiceId, text, modelId = 'eleven_multilingual_v2', voiceSettings } = params;
        if (!voiceId || !text) throw new Error('voiceId and text are required');

        const response = await fetch(`${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            text,
            model_id: modelId,
            voice_settings: voiceSettings || {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.0,
              use_speaker_boost: true
            }
          }),
        });

        if (!response.ok) {
          throw new Error(`API Error: ${await response.text()}`);
        }

        const audioBuffer = await response.arrayBuffer();
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
        
        return new Response(
          JSON.stringify({ success: true, audio: base64Audio, contentType: 'audio/mpeg' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_models': {
        const response = await fetch(`${ELEVENLABS_API_BASE}/models`, { headers });
        if (!response.ok) {
          throw new Error(`API Error: ${await response.text()}`);
        }
        const models = await response.json();
        return new Response(
          JSON.stringify({ success: true, models }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_history': {
        const { pageSize = 100 } = params;
        const response = await fetch(`${ELEVENLABS_API_BASE}/history?page_size=${pageSize}`, { headers });
        if (!response.ok) {
          throw new Error(`API Error: ${await response.text()}`);
        }
        const history = await response.json();
        return new Response(
          JSON.stringify({ success: true, history }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_agents': {
        const response = await fetch(`${ELEVENLABS_API_BASE}/convai/agents`, { headers });
        if (!response.ok) {
          throw new Error(`API Error: ${await response.text()}`);
        }
        const data = await response.json();
        return new Response(
          JSON.stringify({ success: true, agents: data.agents || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('ElevenLabs API error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
