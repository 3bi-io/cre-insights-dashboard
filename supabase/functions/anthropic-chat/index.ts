/**
 * Anthropic Chat Edge Function
 * Handles AI-powered chat with Claude models
 * REFACTORED: Uses shared CORS, rate limiting, and error handling
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightIfNeeded } from '../_shared/cors-config.ts';
import { errorResponse, rateLimitResponse } from '../_shared/response.ts';
import { wrapHandler } from '../_shared/error-handler.ts';
import { enforceRateLimitWithGeo, getRateLimitIdentifier } from '../_shared/rate-limiter.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('anthropic-chat');

interface ChatRequest {
  message: string;
  model?: string;
  systemPrompt?: string;
  includeAnalytics?: boolean;
}

const handler = wrapHandler(async (req: Request) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightIfNeeded(req);
  if (preflightResponse) return preflightResponse;

  // Rate limiting: 30 requests per minute
  const rateLimitId = getRateLimitIdentifier(req, true);
  try {
    const rateLimitResult = await enforceRateLimitWithGeo(req, rateLimitId, {
      maxRequests: 30,
      windowMs: 60000,
      keyPrefix: 'anthropic-chat'
    });
    
    if (rateLimitResult.geoApplied) {
      logger.info('Geo rate limit applied', { 
        rule: rateLimitResult.matchedRule?.id, 
        limit: rateLimitResult.effectiveMaxRequests 
      });
    }
  } catch {
    logger.warn('Rate limit exceeded', { rateLimitId });
    return rateLimitResponse(60, origin);
  }

  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
  
  if (!anthropicApiKey) {
    logger.error('ANTHROPIC_API_KEY not found');
    return errorResponse('Anthropic API key not configured', 500, undefined, origin);
  }

  const { message, model = 'claude-sonnet-4-20250514', systemPrompt, includeAnalytics }: ChatRequest = await req.json();

  if (!message || message.trim().length === 0) {
    return errorResponse('Message is required', 400, undefined, origin);
  }

  logger.info('Processing chat request with Claude', { model, messageLength: message.length });

  const defaultSystemPrompt = `You are ƷBI's intelligent analytics assistant powered by Claude. You provide insightful analysis of recruitment marketing data with a focus on:

- Clear, actionable insights
- Data-driven recommendations  
- Performance optimization strategies
- Trend analysis and forecasting
- ROI and efficiency metrics

Your responses should be:
- Concise but comprehensive
- Professional yet conversational
- Focused on practical next steps
- Supported by logical reasoning

When analyzing data or trends, always explain your methodology and highlight key findings that drive business value.`;

  const messages = [
    {
      role: 'user',
      content: message
    }
  ];

  logger.info('Calling Anthropic API...');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${anthropicApiKey}`,
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 1500,
      system: systemPrompt || defaultSystemPrompt,
      messages: messages
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Anthropic API error', { status: response.status, error: errorText });
    
    // Handle specific error codes
    if (response.status === 429) {
      return errorResponse('Anthropic rate limit exceeded. Please try again later.', 429, undefined, origin);
    }
    if (response.status === 402 || response.status === 403) {
      return errorResponse('Anthropic API access issue. Please check API key and billing.', 402, undefined, origin);
    }
    
    return errorResponse(`Anthropic API error: ${response.status}`, response.status, { details: errorText }, origin);
  }

  const data = await response.json();
  logger.info('Anthropic API response received');

  const generatedText = data.content?.[0]?.text || 'I apologize, but I couldn\'t generate a response. Please try again.';

  return new Response(JSON.stringify({ 
    generatedText,
    model: model,
    provider: 'anthropic'
  }), {
    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
  });

}, { context: 'AnthropicChat', logRequests: true });

serve(handler);
