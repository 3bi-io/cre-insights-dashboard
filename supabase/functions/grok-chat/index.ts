/**
 * Grok Chat Edge Function
 * Streams responses from xAI's Grok models
 * REFACTORED: Uses modern shared utilities
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { errorResponse } from '../_shared/response.ts';
import { wrapHandler } from '../_shared/error-handler.ts';
import { createLogger } from '../_shared/logger.ts';
import { verifyUser } from '../_shared/supabase-client.ts';

const logger = createLogger('grok-chat');

const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })),
  model: z.string().default('grok-2'),
  stream: z.boolean().default(true)
});

const handler = wrapHandler(async (req: Request) => {
  const origin = req.headers.get('origin');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  // Verify user authentication
  const { userId } = await verifyUser(req);
  const contextLogger = logger.child({ userId });
  
  contextLogger.info('Grok chat request received');

  // Parse and validate request
  const body = await req.json();
  const { messages, model, stream } = requestSchema.parse(body);

  // Get xAI API key
  const xaiApiKey = Deno.env.get('XAI_API_KEY');
  if (!xaiApiKey) {
    throw new Error('XAI_API_KEY is not configured');
  }

  // Add system message if not present
  const finalMessages = messages[0]?.role === 'system' 
    ? messages 
    : [
        { 
          role: 'system', 
          content: 'You are Grok 2, xAI\'s advanced AI assistant. You excel at reasoning, analysis, creative tasks, and real-time information. Be witty, helpful, and direct.' 
        },
        ...messages
      ];

  contextLogger.info('Calling xAI API', { 
    model, 
    messageCount: finalMessages.length,
    streaming: stream 
  });

  try {
    // Call xAI API
    const xaiResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${xaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: finalMessages,
        stream,
        temperature: 0.7,
      }),
    });

    if (!xaiResponse.ok) {
      const errorText = await xaiResponse.text();
      contextLogger.error('xAI API error', new Error(errorText), { 
        status: xaiResponse.status 
      });

      // Handle rate limiting
      if (xaiResponse.status === 429) {
        return errorResponse(
          'Rate limit exceeded. Please try again later.',
          429,
          {},
          origin
        );
      }

      return errorResponse(
        `xAI API error: ${xaiResponse.status}`,
        xaiResponse.status,
        { details: errorText },
        origin
      );
    }

    contextLogger.info('xAI API response received', { 
      status: xaiResponse.status 
    });

    // Stream the response back to client
    if (stream) {
      return new Response(xaiResponse.body, {
        headers: {
          ...getCorsHeaders(origin),
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const data = await xaiResponse.json();
      return new Response(JSON.stringify(data), {
        headers: {
          ...getCorsHeaders(origin),
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    contextLogger.error('Failed to call xAI API', error);
    throw error;
  }
}, { context: 'GrokChat', logRequests: true });

serve(handler);
