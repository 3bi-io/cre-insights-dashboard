// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

const getAnalyticsData = async () => {
  try {
    console.log('Fetching analytics data for context...');
    
    const response = await supabase.functions.invoke('chatbot-analytics', {
      body: { query: 'general overview' }
    });

    if (response.error) {
      console.error('Analytics fetch error:', response.error);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return null;
  }
};

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, model = 'gpt-5-2025-08-07', systemPrompt, includeAnalytics }: ChatRequest = await req.json();

    console.log('Received chat request:', { message, model, includeAnalytics });

    let contextData = '';
    const isAnalyticsQuery = includeAnalytics || detectAnalyticsQuery(message);

    // If it's an analytics query, get data from our analytics function
    if (isAnalyticsQuery) {
      console.log('Detected analytics query, fetching data...');
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
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          // Otherwise, use the analytics data as context for OpenAI
          contextData = `\n\nCurrent System Analytics Context:\n${JSON.stringify(analytics, null, 2)}`;
        }
      } catch (analyticsError) {
        console.error('Analytics function error:', analyticsError);
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

    console.log('Calling OpenAI with model:', model);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_completion_tokens: 1000, // Updated for GPT-5 compatibility
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No response generated from OpenAI');
    }

    console.log('OpenAI response generated successfully');

    return new Response(JSON.stringify({ 
      generatedText,
      source: 'openai',
      model 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in openai-chat function:', error);
    
    // Provide a helpful fallback response
    const fallbackResponse = "I'm experiencing technical difficulties right now. However, I'm here to help you analyze your recruitment marketing data, track application metrics, monitor spending across platforms, and provide insights on job performance. Please try your question again in a moment, or let me know what specific data you'd like to explore.";
    
    return new Response(JSON.stringify({ 
      generatedText: fallbackResponse,
      error: error.message,
      source: 'fallback'
    }), {
      status: 200, // Return 200 to avoid client-side errors
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
