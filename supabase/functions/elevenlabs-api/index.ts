/**
 * ElevenLabs API Edge Function
 * Proxy for ElevenLabs API operations with proper error handling
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { wrapHandler, ValidationError, ExternalAPIError } from '../_shared/error-handler.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('elevenlabs-api');
const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

const handler = wrapHandler(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
  if (!ELEVENLABS_API_KEY) {
    return errorResponse('ElevenLabs API key not configured', 500);
  }

  const { action, ...params } = await req.json();
  logger.info('ElevenLabs API action', { action });

  const headers = {
    'xi-api-key': ELEVENLABS_API_KEY,
    'Content-Type': 'application/json',
  };

  switch (action) {
    case 'test_connection': {
      const response = await fetch(`${ELEVENLABS_API_BASE}/user`, { headers });
      if (!response.ok) {
        const error = await response.text();
        throw new ExternalAPIError(`API Error: ${error}`, response.status);
      }
      const user = await response.json();
      return successResponse({ user });
    }

    case 'get_subscription': {
      const response = await fetch(`${ELEVENLABS_API_BASE}/user/subscription`, { headers });
      if (!response.ok) {
        throw new ExternalAPIError(`API Error: ${await response.text()}`, response.status);
      }
      const subscription = await response.json();
      return successResponse({ subscription });
    }

    case 'get_voices': {
      const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, { headers });
      if (!response.ok) {
        throw new ExternalAPIError(`API Error: ${await response.text()}`, response.status);
      }
      const data = await response.json();
      return successResponse({ voices: data.voices });
    }

    case 'get_voice': {
      const { voiceId } = params;
      if (!voiceId) throw new ValidationError('voiceId is required');
      
      const response = await fetch(`${ELEVENLABS_API_BASE}/voices/${voiceId}`, { headers });
      if (!response.ok) {
        throw new ExternalAPIError(`API Error: ${await response.text()}`, response.status);
      }
      const voice = await response.json();
      return successResponse({ voice });
    }

    case 'text_to_speech': {
      const { voiceId, text, modelId = 'eleven_multilingual_v2', voiceSettings } = params;
      if (!voiceId || !text) throw new ValidationError('voiceId and text are required');

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
        throw new ExternalAPIError(`API Error: ${await response.text()}`, response.status);
      }

      const audioBuffer = await response.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
      
      return successResponse({ audio: base64Audio, contentType: 'audio/mpeg' });
    }

    case 'get_models': {
      const response = await fetch(`${ELEVENLABS_API_BASE}/models`, { headers });
      if (!response.ok) {
        throw new ExternalAPIError(`API Error: ${await response.text()}`, response.status);
      }
      const models = await response.json();
      return successResponse({ models });
    }

    case 'get_history': {
      const { pageSize = 100 } = params;
      const response = await fetch(`${ELEVENLABS_API_BASE}/history?page_size=${pageSize}`, { headers });
      if (!response.ok) {
        throw new ExternalAPIError(`API Error: ${await response.text()}`, response.status);
      }
      const history = await response.json();
      return successResponse({ history });
    }

    case 'get_agents': {
      const response = await fetch(`${ELEVENLABS_API_BASE}/convai/agents`, { headers });
      if (!response.ok) {
        throw new ExternalAPIError(`API Error: ${await response.text()}`, response.status);
      }
      const data = await response.json();
      return successResponse({ agents: data.agents || [] });
    }

    default:
      throw new ValidationError(`Unknown action: ${action}`);
  }
}, { context: 'ElevenLabsAPI', logRequests: true });

serve(handler);
