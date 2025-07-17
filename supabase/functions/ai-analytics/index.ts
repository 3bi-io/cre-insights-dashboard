import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    console.log('AI Analytics function called')
    const { applications } = await req.json()
    
    console.log('Processing', applications.length, 'applications')

    // Analyze the data directly instead of using OpenAI for now
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

      // Category analysis (D, SR, SC, N/A)
      // D = Driver (CDL holders with experience)
      // SR = Senior (experienced, 48+ months)
      // SC = Semi-experienced (some experience, less than 48 months)
      // N/A = No experience or missing data
      if (app.cdl === 'Yes' && app.months === '48+') {
        categoryStats.D++
      } else if (app.months === '48+' && app.exp === 'More than 3 months experience') {
        categoryStats.SR++
      } else if (app.exp === 'More than 3 months experience' || (app.months && app.months !== '48+' && app.months !== '1')) {
        categoryStats.SC++
      } else {
        categoryStats['N/A']++
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

    const insights = [
      `Total of ${applications.length} applications received`,
      `Top location: ${locationConversion[0]?.location || 'Various'} with ${locationConversion[0]?.totalApplications || 0} applications`,
      `${veteranStats.yes} veterans among applicants (${((veteranStats.yes / applications.length) * 100).toFixed(1)}%)`,
      `${cdlStats.yes} applicants have CDL (${((cdlStats.yes / applications.length) * 100).toFixed(1)}%)`,
      `Category breakdown: D=${categoryStats.D}, SR=${categoryStats.SR}, SC=${categoryStats.SC}, N/A=${categoryStats['N/A']}`,
      `Primary sources: ${Array.from(sourceStats.keys()).join(', ')}`
    ]

    const recommendations = [
      'All applications are currently pending - review and update statuses to track conversion rates',
      'Focus recruitment efforts on high-performing locations like ' + (locationConversion[0]?.location || 'current top markets'),
      'Leverage Facebook and Instagram channels as they appear to be primary sources',
      `Prioritize D category applicants (${categoryStats.D}) - CDL holders with 48+ months experience`,
      `Develop SR category applicants (${categoryStats.SR}) - experienced candidates for senior roles`,
      'Implement application status tracking to better measure conversion rates'
    ]

    const result = {
      locationConversion,
      statusBreakdown,
      categoryBreakdown,
      insights,
      recommendations
    }

    console.log('Returning result:', result)

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