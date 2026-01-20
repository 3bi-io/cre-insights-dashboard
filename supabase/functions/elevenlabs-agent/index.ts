/**
 * ElevenLabs Agent Edge Function
 * Fetches conversation token for WebRTC connection (faster than WebSocket)
 */
import { createLogger } from '../_shared/logger.ts';
import { successResponse, errorResponse, validationErrorResponse } from '../_shared/response.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';

const logger = createLogger('elevenlabs-agent');

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { agentId } = await req.json();

    if (!agentId) {
      logger.warn('Missing agent ID in request');
      return validationErrorResponse('Agent ID is required', origin ?? undefined);
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!ELEVENLABS_API_KEY) {
      logger.error('ElevenLabs API key not configured');
      return errorResponse('ElevenLabs API key not configured', 500, undefined, origin ?? undefined);
    }

    logger.info('Requesting conversation token', { agentId });

    // Create AbortController with 10 second timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logger.warn('Request timeout - aborting after 10s', { agentId });
      controller.abort();
    }, 10000);

    try {
      // Use signed URL endpoint - provides authenticated WebSocket URL
      // This is the reliable approach that works with the @11labs/react SDK
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
        {
          method: 'GET',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('ElevenLabs API error', { status: response.status, error: errorText });
        return errorResponse(
          `ElevenLabs API error: ${response.status} - ${errorText}`,
          response.status,
          undefined,
          origin ?? undefined
        );
      }

      const data = await response.json();
      const duration = Date.now() - startTime;
      
      logger.info('Signed URL obtained', { 
        agentId, 
        durationMs: duration,
        hasSignedUrl: !!data.signed_url 
      });

      // Return signedUrl for SDK connection
      return successResponse(
        { 
          signedUrl: data.signed_url 
        },
        'Conversation token obtained successfully',
        { durationMs: duration },
        origin ?? undefined
      );

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        logger.error('Request timed out', { agentId, durationMs: Date.now() - startTime });
        return errorResponse(
          'Connection to ElevenLabs timed out. Please try again.',
          504,
          undefined,
          origin ?? undefined
        );
      }
      
      throw fetchError;
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in elevenlabs-agent function', error, { durationMs: duration });
    
    return errorResponse(
      error.message || 'Internal server error',
      500,
      undefined,
      origin ?? undefined
    );
  }
});
