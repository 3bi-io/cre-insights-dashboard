import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { applications } = await req.json()
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Prepare data for analysis
    const analysisPrompt = `
    Analyze the following application data and provide insights:

    Applications Data:
    ${JSON.stringify(applications, null, 2)}

    Please provide analysis in this exact JSON format:
    {
      "locationConversion": [
        {
          "location": "City, State",
          "conversionRate": 85.5,
          "totalApplications": 50
        }
      ],
      "statusBreakdown": [
        {
          "status": "pending",
          "percentage": 45.2,
          "count": 23
        }
      ],
      "insights": [
        "Key insight about application patterns",
        "Another important finding"
      ],
      "recommendations": [
        "Actionable recommendation based on data",
        "Another strategic suggestion"
      ]
    }

    Focus on:
    1. Location-based conversion rates (cities/states with best application success)
    2. Status distribution (pending, approved, rejected, etc.)
    3. Meaningful insights about application patterns
    4. Actionable recommendations for improving application processes

    Provide realistic percentages and meaningful analysis based on the actual data provided.
    `

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a data analyst specializing in recruitment and application analytics. Provide detailed, actionable insights based on application data. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const analysisContent = data.choices[0].message.content

    // Parse the JSON response
    let analysisResult
    try {
      analysisResult = JSON.parse(analysisContent)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', analysisContent)
      throw new Error('Invalid response format from AI analysis')
    }

    return new Response(
      JSON.stringify(analysisResult),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error in ai-analytics function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate analytics',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})