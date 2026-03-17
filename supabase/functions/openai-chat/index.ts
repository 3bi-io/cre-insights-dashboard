/**
 * OpenAI Chat Edge Function
 * Handles AI-powered chat with analytics context
 * REFACTORED: Uses shared CORS, rate limiting, and error handling
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.50.0';
import { getCorsHeaders, handleCorsPreflightIfNeeded } from '../_shared/cors-config.ts';
import { successResponse, errorResponse, rateLimitResponse } from '../_shared/response.ts';
import { wrapHandler } from '../_shared/error-handler.ts';
import { enforceRateLimitWithGeo, getRateLimitIdentifier } from '../_shared/rate-limiter.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('openai-chat');

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface ChatRequest {
  message: string;
  model?: string;
  systemPrompt?: string;
  includeAnalytics?: boolean;
}

const detectAnalyticsQuery = (message: string): boolean => {
  const analyticsKeywords = [
    'how many', 'total', 'count', 'analytics', 'data', 'metrics', 'performance',
    'applications', 'jobs', 'spending', 'budget', 'clients', 'platforms',
    'breakdown', 'distribution', 'trends', 'compare', 'analysis'
  ];
  
  return analyticsKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
};

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
      keyPrefix: 'openai-chat'
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

  // Validate API key
  if (!openAIApiKey) {
    logger.error('OPENAI_API_KEY not configured');
    return errorResponse('OpenAI API key not configured', 500, undefined, origin);
  }

  const { message, model = 'gpt-4.1-2025-04-14', systemPrompt, includeAnalytics }: ChatRequest = await req.json();

  if (!message || message.trim().length === 0) {
    return errorResponse('Message is required', 400, undefined, origin);
  }

  logger.info('Received chat request', { messageLength: message.length, model, includeAnalytics });

  let contextData = '';
  const isAnalyticsQuery = includeAnalytics || detectAnalyticsQuery(message);

  // If it's an analytics query, get data from our analytics function
  if (isAnalyticsQuery) {
    logger.info('Detected analytics query, fetching data...');
    try {
      const analyticsResponse = await supabase.functions.invoke('chatbot-analytics', {
        body: { query: message }
      });

      if (analyticsResponse.data && !analyticsResponse.error) {
        const { response: analyticsText, analytics } = analyticsResponse.data;
        
        // If we got a comprehensive analytics response, return it directly
        if (analyticsText && analyticsText.length > 100) {
          return new Response(JSON.stringify({ 
            generatedText: analyticsText,
            source: 'analytics',
            data: analytics
          }), {
            headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
          });
        }
        
        // Otherwise, use the analytics data as context for OpenAI
        contextData = `\n\nCurrent System Analytics Context:\n${JSON.stringify(analytics, null, 2)}`;
      }
    } catch (analyticsError) {
      logger.error('Analytics function error', analyticsError);
      // Continue with OpenAI if analytics fails
    }
  }

  const defaultSystemPrompt = `You are ƷBI's intelligent business assistant. You help users understand their recruitment marketing data and business metrics.

Key capabilities:
- Analyze recruitment marketing performance and job posting data
- Provide insights on application trends, spending, and ROI
- Help with platform comparison and optimization
- Answer questions about clients, jobs, applications, and spending
- Offer strategic recommendations for improving recruitment outcomes

When discussing data or analytics:
- Be specific with numbers when available
- Highlight key trends and patterns
- Suggest actionable next steps
- Keep responses concise but informative
- Use bullet points for clarity when presenting multiple metrics

If asked about data you don't have access to, explain what information you'd need to provide a complete answer.${contextData}`;

  const messages = [
    { 
      role: 'system', 
      content: systemPrompt || defaultSystemPrompt
    },
    { role: 'user', content: message }
  ];

  logger.info('Calling OpenAI', { model });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_completion_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('OpenAI API error', { status: response.status, error: errorText });
    
    // Handle specific error codes
    if (response.status === 429) {
      return errorResponse('OpenAI rate limit exceeded. Please try again later.', 429, undefined, origin);
    }
    if (response.status === 402 || response.status === 403) {
      return errorResponse('OpenAI API access issue. Please check API key and billing.', 402, undefined, origin);
    }
    
    return errorResponse(`OpenAI API error: ${response.status}`, response.status, { details: errorText }, origin);
  }

  const data = await response.json();
  const generatedText = data.choices[0]?.message?.content;

  if (!generatedText) {
    return errorResponse('No response generated from OpenAI', 500, undefined, origin);
  }

  logger.info('OpenAI response generated successfully');

  return new Response(JSON.stringify({ 
    generatedText,
    source: 'openai',
    model 
  }), {
    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
  });

}, { context: 'OpenAIChat', logRequests: true });

serve(handler);
