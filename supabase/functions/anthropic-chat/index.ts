// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  model?: string;
  systemPrompt?: string;
  includeAnalytics?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    if (!anthropicApiKey) {
      console.error('ANTHROPIC_API_KEY not found');
      return new Response(JSON.stringify({ 
        error: 'Anthropic API key not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, model = 'claude-sonnet-4-5', systemPrompt, includeAnalytics }: ChatRequest = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ 
        error: 'Message is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing chat request with Claude:', { model, messageLength: message.length });

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

    console.log('Calling Anthropic API...');

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
      console.error('Anthropic API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Anthropic API response received');

    const generatedText = data.content?.[0]?.text || 'I apologize, but I couldn\'t generate a response. Please try again.';

    return new Response(JSON.stringify({ 
      generatedText,
      model: model,
      provider: 'anthropic'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in anthropic-chat function:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to process request with Claude',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});