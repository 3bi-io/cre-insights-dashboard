import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { enforceAuth } from '../_shared/serverAuth.ts';
import { enforceRateLimit, getRateLimitIdentifier } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    } catch (rateLimitError) {
      console.warn(`Rate limit exceeded for ${rateLimitId}`);
      return new Response(
        JSON.stringify({ 
          error: "Too many requests. Please wait a moment before trying again.",
          retryAfter: 60 
        }),
        {
          status: 429,
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": "60"
          },
        }
      );
    }

    // Parse and validate request body
    const rawBody = await req.json();
    const validationResult = ChatRequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.error('AI chat validation failed:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid chat request', 
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
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
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
