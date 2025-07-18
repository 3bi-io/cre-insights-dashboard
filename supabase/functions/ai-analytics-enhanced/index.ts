import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    console.log('AI Analytics Enhanced function called')
    const { applications, aiProvider = 'basic', extraContext = '' } = await req.json()
    
    console.log(`Processing ${applications.length} applications with ${aiProvider} provider`)

    // Always generate the basic analytics first
    const locationStats = new Map()
    const statusStats = new Map()
    const sourceStats = new Map()
    const veteranStats = { yes: 0, no: 0, unknown: 0 }
    const cdlStats = { yes: 0, no: 0, unknown: 0 }
    const categoryStats = { D: 0, SR: 0, SC: 0, 'N/A': 0 }

    applications.forEach(app => {
      // Location analysis
      const location = app.city && app.state ? `${app.city}, ${app.state}` : 'Unknown Location'
      locationStats.set(location, (locationStats.get(location) || 0) + 1)

      // Status analysis
      const status = app.status || 'unknown'
      statusStats.set(status, (statusStats.get(status) || 0) + 1)

      // Source analysis
      const source = app.source || 'unknown'
      sourceStats.set(source, (sourceStats.get(source) || 0) + 1)

      // Veteran analysis
      if (app.veteran === 'yes') veteranStats.yes++
      else if (app.veteran === 'no') veteranStats.no++
      else veteranStats.unknown++

      // CDL analysis
      if (app.cdl === 'Yes') cdlStats.yes++
      else if (app.cdl === 'No') cdlStats.no++
      else cdlStats.unknown++

      // Category analysis (D, SR, SC, N/A) based on experience rules
      const hasCDL = app.cdl === 'Yes' || app.cdl === 'yes'
      const experienceMonths = app.months || app.exp || ''
      
      // Parse experience to determine if 48+ months (4 years)
      const has48MonthsExp = experienceMonths.includes('48+') || 
                            experienceMonths.includes('4+ years') ||
                            experienceMonths.includes('More than 4 years') ||
                            experienceMonths.includes('5+ years') ||
                            (experienceMonths.match(/\d+/) && parseInt(experienceMonths.match(/\d+/)[0]) >= 48)
      
      // Check for some experience but less than 48 months
      const hasSomeExp = experienceMonths.includes('3+') ||
                        experienceMonths.includes('6+') ||
                        experienceMonths.includes('12+') ||
                        experienceMonths.includes('24+') ||
                        experienceMonths.includes('36+') ||
                        experienceMonths.toLowerCase().includes('months') ||
                        experienceMonths.toLowerCase().includes('year') ||
                        (experienceMonths.match(/\d+/) && parseInt(experienceMonths.match(/\d+/)[0]) > 0 && parseInt(experienceMonths.match(/\d+/)[0]) < 48)
      
      // Apply categorization rules
      if (hasCDL && has48MonthsExp) {
        categoryStats.D++ // Driver: CDL holders with 48+ months experience
      } else if (!hasCDL && has48MonthsExp) {
        categoryStats.SR++ // Senior: Senior experienced (48+ months) without CDL
      } else if (hasSomeExp && !has48MonthsExp) {
        categoryStats.SC++ // Semi-experienced: Some experience, less than 48 months
      } else {
        categoryStats['N/A']++ // N/A: No experience or missing data
      }
    })

    // Convert to arrays and sort
    const locationConversion = Array.from(locationStats.entries())
      .map(([location, count]) => ({
        location,
        conversionRate: 100, // Assume 100% for now since all are pending
        totalApplications: count
      }))
      .sort((a, b) => b.totalApplications - a.totalApplications)
      .slice(0, 5)

    const statusBreakdown = Array.from(statusStats.entries())
      .map(([status, count]) => ({
        status,
        percentage: (count / applications.length) * 100,
        count
      }))

    const categoryBreakdown = Object.entries(categoryStats)
      .map(([category, count]) => ({
        category,
        percentage: (count / applications.length) * 100,
        count
      }))

    // Default insights and recommendations (basic)
    let insights = [
      `Total of ${applications.length} applications received`,
      `Top location: ${locationConversion[0]?.location || 'Various'} with ${locationConversion[0]?.totalApplications || 0} applications`,
      `${veteranStats.yes} veterans among applicants (${((veteranStats.yes / applications.length) * 100).toFixed(1)}%)`,
      `${cdlStats.yes} applicants have CDL (${((cdlStats.yes / applications.length) * 100).toFixed(1)}%)`,
      `Category breakdown: D=${categoryStats.D}, SR=${categoryStats.SR}, SC=${categoryStats.SC}, N/A=${categoryStats['N/A']}`,
      `Primary sources: ${Array.from(sourceStats.keys()).join(', ')}`
    ]

    let recommendations = [
      'All applications are currently pending - review and update statuses to track conversion rates',
      'Focus recruitment efforts on high-performing locations like ' + (locationConversion[0]?.location || 'current top markets'),
      'Leverage Facebook and Instagram channels as they appear to be primary sources',
      `Prioritize D category applicants (${categoryStats.D}) - CDL holders with 48+ months experience`,
      `Develop SR category applicants (${categoryStats.SR}) - experienced candidates for senior roles`,
      'Implement application status tracking to better measure conversion rates'
    ]

    // For AI-enhanced analytics, get insights and recommendations from AI providers
    if (aiProvider !== 'basic') {
      const dataForAI = {
        applicationCount: applications.length,
        categories: categoryStats,
        topLocations: locationConversion.slice(0, 5),
        statusBreakdown,
        veteranStats,
        cdlStats,
        sources: Object.fromEntries(sourceStats)
      }

      const prompt = `
As a recruiting analytics expert, analyze this application data and provide:
1. Five to seven key insights about the data
2. Five to seven actionable recommendations for recruiting strategy

Data summary:
${JSON.stringify(dataForAI, null, 2)}

${extraContext ? `Additional context: ${extraContext}` : ''}

Format your response as a JSON object with two arrays:
{
  "insights": ["insight 1", "insight 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}
`

      if (aiProvider === 'openai') {
        // Use OpenAI for enhanced insights
        const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openAIApiKey) throw new Error('OpenAI API key is not configured')

        console.log('Calling OpenAI API')
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are a recruiting analytics expert specializing in the trucking and logistics industry.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.5
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
        }

        const aiResponse = await response.json()
        try {
          const analysisText = aiResponse.choices[0]?.message?.content
          const analysis = JSON.parse(analysisText)
          insights = analysis.insights || insights
          recommendations = analysis.recommendations || recommendations
        } catch (parseError) {
          console.error('Error parsing OpenAI response:', parseError)
          // Fall back to basic insights if parsing fails
        }
      } 
      else if (aiProvider === 'anthropic') {
        // Use Anthropic Claude for enhanced insights
        const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
        if (!anthropicApiKey) throw new Error('Anthropic API key is not configured')

        console.log('Calling Anthropic API')
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${anthropicApiKey}`,
            'Content-Type': 'application/json',
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            temperature: 0.5,
            system: 'You are a recruiting analytics expert specializing in the trucking and logistics industry.',
            messages: [
              { role: 'user', content: prompt }
            ]
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Anthropic API error: ${response.status} - ${errorText}`)
        }

        const aiResponse = await response.json()
        try {
          const analysisText = aiResponse.content?.[0]?.text || ''
          const analysis = JSON.parse(analysisText)
          insights = analysis.insights || insights
          recommendations = analysis.recommendations || recommendations
        } catch (parseError) {
          console.error('Error parsing Anthropic response:', parseError)
          // Fall back to basic insights if parsing fails
        }
      }
    }

    const result = {
      locationConversion,
      statusBreakdown,
      categoryBreakdown,
      insights,
      recommendations,
      provider: aiProvider
    }

    console.log(`Analysis complete with ${aiProvider} provider`)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error in ai-analytics-enhanced function:', error)
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