/**
 * Map AI Chat Edge Function
 * Public endpoint for the /map AI Job Search Guide
 * No auth required — uses IP-based rate limiting
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('map-ai-chat');

// Simple in-memory rate limiter (10 req/min per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

// Periodically clean old entries
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 120000);

serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip')
      || 'unknown';

    if (!checkRateLimit(clientIp)) {
      return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages, mapContext } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cap conversation length
    const trimmedMessages = messages.slice(-20);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context-aware system prompt
    const ctx = mapContext || {};
    const filterSummary = [];
    if (ctx.searchTerm) filterSummary.push(`Search: "${ctx.searchTerm}"`);
    if (ctx.companyFilter) filterSummary.push(`Company: ${ctx.companyFilter}`);
    if (ctx.categoryFilter) filterSummary.push(`Category: ${ctx.categoryFilter}`);
    if (ctx.exactOnly) filterSummary.push('Exact locations only');

    const systemPrompt = `You are the AI Job Search Guide on Apply AI's interactive job map — a premium recruitment platform for CDL trucking and logistics jobs.

Current map context:
- Total jobs: ${ctx.totalJobs || 'unknown'}
- Visible locations: ${ctx.uniqueLocations || 'unknown'}
- Confidence breakdown: ${ctx.exactCount || 0} exact city, ${ctx.stateCount || 0} state-level, ${ctx.countryCount || 0} country/international
- Mapped coverage: ${ctx.mappedPercentage || 0}%
- Visible jobs after filters: ${ctx.visibleJobs || ctx.totalJobs || 'unknown'}
${filterSummary.length > 0 ? `- Active filters: ${filterSummary.join(', ')}` : '- No filters active'}
${ctx.topCompanies ? `- Top companies: ${ctx.topCompanies}` : ''}
${ctx.topCategories ? `- Top categories: ${ctx.topCategories}` : ''}
${ctx.displayMode ? `- Display mode: ${ctx.displayMode}` : ''}

Guidelines:
- Help users discover jobs by location. Be specific, actionable, and concise (2-4 sentences per response).
- Reference the actual numbers from the context above.
- When suggesting map actions, include them in this format so the UI can create clickable buttons:
  [ACTION:filter_exact_only] — toggle exact-only filter
  [ACTION:search "term"] — set search term
  [ACTION:clear_filters] — clear all filters
  [ACTION:density_mode] — switch to density display mode
  [ACTION:detail_mode] — switch to detail display mode
- Do not invent job data. Only reference what the context tells you.
- If asked about specific salaries or details you don't have, direct users to click markers or use the list view.
- Keep a professional, helpful tone. You are a career copilot, not a chatbot.`;

    logger.info('Processing map AI chat', {
      messageCount: trimmedMessages.length,
      hasContext: !!mapContext,
      ip: clientIp,
    });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...trimmedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Service temporarily unavailable.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      logger.error('AI gateway error', new Error(errorText), { status: response.status });
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (e) {
    logger.error('map-ai-chat error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
