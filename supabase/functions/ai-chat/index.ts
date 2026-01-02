/**
 * AI Chat Edge Function
 * Handles AI-powered chat conversations with proper validation and rate limiting
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { wrapHandler, ValidationError } from '../_shared/error-handler.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { enforceAuth } from '../_shared/serverAuth.ts';
import { enforceRateLimit, getRateLimitIdentifier } from '../_shared/rate-limiter.ts';

// Zod validation schemas
const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string()
    .trim()
    .min(1, "Message content cannot be empty")
    .max(4000, "Message content too long (max 4000 characters)")
    .refine(
      (content) => {
        // Basic prompt injection detection - prevent system role impersonation
        const suspiciousPatterns = [
          /ignore\s+(all\s+)?(previous|above|prior)\s+instructions?/i,
          /you\s+are\s+now/i,
          /new\s+instructions?:/i,
          /system\s*:/i,
          /\[system\]/i,
          /<\s*system\s*>/i
        ];
        return !suspiciousPatterns.some(pattern => pattern.test(content));
      },
      "Message contains suspicious patterns"
    )
});

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema)
    .min(1, "At least one message is required")
    .max(50, "Too many messages in conversation (max 50)")
    .refine(
      (messages) => {
        // Ensure no multiple system messages from user
        const systemMessages = messages.filter(m => m.role === "system");
        return systemMessages.length === 0; // User should not send system messages
      },
      "System messages are not allowed from client"
    )
});

const handler = wrapHandler(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Enforce authentication - only authenticated users can use AI chat
  const authContext = await enforceAuth(req, 'user');
  if (authContext instanceof Response) {
    return authContext;
  }

  // Rate limiting: 20 requests per minute per user
  const rateLimitId = getRateLimitIdentifier(req, true);
  try {
    await enforceRateLimit(rateLimitId, {
      maxRequests: 20,
      windowMs: 60000, // 1 minute
      keyPrefix: 'ai-chat'
    });
  } catch {
    console.warn(`Rate limit exceeded for ${rateLimitId}`);
    return errorResponse("Too many requests. Please wait a moment before trying again.", 429, { retryAfter: 60 });
  }

  // Parse and validate request body
  const rawBody = await req.json();
  const validationResult = ChatRequestSchema.safeParse(rawBody);
  
  if (!validationResult.success) {
    console.error('AI chat validation failed:', validationResult.error.issues);
    throw new ValidationError('Invalid chat request', validationResult.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    })));
  }

  const { messages } = validationResult.data;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  console.log(`AI chat request: ${messages.length} messages, user: ${authContext.userId}`);

  const systemPrompt = `You are an AI recruitment assistant for ATS.me. Help users with:
- Job posting questions and best practices
- Candidate evaluation guidance
- Interview preparation and scheduling
- Recruitment process optimization
- Understanding AI scores and recommendations

Keep responses clear, professional, and actionable. If asked about specific candidates or data, remind users to check the application details in the dashboard.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      return errorResponse("Rate limit exceeded. Please try again later.", 429);
    }
    if (response.status === 402) {
      return errorResponse("Payment required. Please add credits to your workspace.", 402);
    }
    
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    return errorResponse("AI gateway error", 500);
  }

  return new Response(response.body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}, { context: 'AiChat', logRequests: true });

serve(handler);
