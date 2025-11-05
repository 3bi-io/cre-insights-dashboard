import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from '../_shared/cors-config.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const XAI_API_KEY = Deno.env.get('XAI_API_KEY');
    
    if (!XAI_API_KEY) {
      console.error('XAI_API_KEY is not set');
      throw new Error('XAI API key is not configured. Please add it in the Supabase secrets.');
    }

    const { message, systemPrompt, model = 'grok-2-1212', includeAnalytics = false } = await req.json();

    console.log('Received Grok chat request:', {
      message: message.substring(0, 100),
      model,
      includeAnalytics
    });

    const messages = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: message
    });

    console.log('Calling xAI Grok API with model:', model);

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('xAI API error:', errorText);
      throw new Error(`xAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('xAI Grok response received');

    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No response generated from xAI Grok');
    }

    return new Response(
      JSON.stringify({ 
        generatedText,
        model,
        provider: 'xai'
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in grok-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while processing your request',
        provider: 'xai'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
