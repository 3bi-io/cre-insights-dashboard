
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get query parameters
    const url = new URL(req.url)
    const platform = url.searchParams.get('platform')
    const user_id = url.searchParams.get('user_id')

    // Create Supabase client with service role to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Build query for job listings
    let query = supabaseClient
      .from('job_listings')
      .select(`
        *,
        job_categories:category_id(name),
        job_platform_associations!inner(
          platform_id,
          platforms!inner(name)
        )
      `)
      .eq('status', 'active')

    // Filter by platform if specified
    if (platform) {
      query = query.eq('job_platform_associations.platforms.name', platform)
    }

    // Filter by user if specified
    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    query = query.order('created_at', { ascending: false })

    const { data: jobListings, error } = await query

    if (error) {
      throw error
    }

    // Generate XML based on platform
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>'
    const xmlContent = platform === 'google jobs' 
      ? generateGoogleJobsXML(jobListings || [])
      : generateJobFeedXML(jobListings || [])

    return new Response(xmlHeader + '\n' + xmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Error generating XML feed:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

function generateJobFeedXML(jobs: any[]): string {
  const xmlJobs = jobs.map(job => {
    const id = escapeXml(job.id || '')
    const title = escapeXml(job.title || job.job_title || '')
    const jobSummary = escapeXml(job.job_summary || job.job_description || '')
    const location = escapeXml(job.location || `${job.city || ''}, ${job.state || ''}`.trim().replace(/^,\s*|,\s*$/, '') || '')
    const category = escapeXml(job.job_categories?.name || '')
    const salaryMin = job.salary_min || ''
    const salaryMax = job.salary_max || ''
    const salaryType = escapeXml(job.salary_type || '')
    const url = escapeXml(job.url || '')
    const jobType = escapeXml(job.job_type || '')
    const applyUrl = escapeXml(job.apply_url || '')

    return `    <job>
      <id>${id}</id>
      <title>${title}</title>
      <job_summary>${jobSummary}</job_summary>
      <location>${location}</location>
      <category>${category}</category>
      <salary_min>${salaryMin}</salary_min>
      <salary_max>${salaryMax}</salary_max>
      <salary_type>${salaryType}</salary_type>
      <url>${url}</url>
      <job_type>${jobType}</job_type>
      <apply_url>${applyUrl}</apply_url>
    </job>`
  }).join('\n')

  return `<job_feed>
  <metadata>
    <generated_at>${new Date().toISOString()}</generated_at>
    <job_count>${jobs.length}</job_count>
  </metadata>
  <jobs>
${xmlJobs}
  </jobs>
</job_feed>`
}

function generateGoogleJobsXML(jobs: any[]): string {
  const xmlJobs = jobs.map(job => {
    const title = escapeXml(job.title || job.job_title || '')
    const description = escapeXml(job.job_summary || job.job_description || '')
    const location = formatLocation(job.location, job.city, job.state)
    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type)
    const jobType = formatJobType(job.job_type)
    const experienceLevel = formatExperienceLevel(job.experience_level)
    const validThrough = getValidThroughDate(job.created_at)
    const identifier = escapeXml(job.id || '')
    const datePosted = new Date(job.created_at).toISOString().split('T')[0]

    return `    <item>
      <title><![CDATA[${title}]]></title>
      <description><![CDATA[${description}]]></description>
      <g:job_type>${jobType}</g:job_type>
      <g:location>${location}</g:location>
      <g:salary>${salary}</g:salary>
      <g:experience_level>${experienceLevel}</g:experience_level>
      <g:job_function>Transportation</g:job_function>
      <g:expiration_date>${validThrough}</g:expiration_date>
      <g:id>${identifier}</g:id>
      <pubDate>${datePosted}</pubDate>
      <link>${escapeXml(job.url || job.apply_url || '')}</link>
    </item>`
  }).join('\n')

  return `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Job Listings</title>
    <description>Active job listings feed for Google Jobs</description>
    <link>https://example.com</link>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${xmlJobs}
  </channel>
</rss>`
}

function formatLocation(location?: string, city?: string, state?: string): string {
  if (location) return escapeXml(location)
  const parts = [city, state].filter(Boolean)
  return escapeXml(parts.join(', '))
}

function formatSalary(min?: number, max?: number, type?: string): string {
  if (!min && !max) return ''
  
  const currency = 'USD'
  const period = type === 'hourly' ? 'HOUR' : 'YEAR'
  
  if (min && max && min !== max) {
    return `${min}-${max} ${currency} per ${period}`
  } else {
    const amount = min || max || 0
    return `${amount} ${currency} per ${period}`
  }
}

function formatJobType(jobType?: string): string {
  const typeMap: { [key: string]: string } = {
    'full-time': 'FULL_TIME',
    'part-time': 'PART_TIME',
    'contract': 'CONTRACTOR',
    'temporary': 'TEMPORARY',
    'internship': 'INTERN'
  }
  return typeMap[jobType?.toLowerCase() || ''] || 'FULL_TIME'
}

function formatExperienceLevel(experienceLevel?: string): string {
  const levelMap: { [key: string]: string } = {
    'entry': 'ENTRY_LEVEL',
    'mid': 'MID_LEVEL', 
    'senior': 'SENIOR_LEVEL',
    'executive': 'EXECUTIVE'
  }
  return levelMap[experienceLevel?.toLowerCase() || ''] || 'MID_LEVEL'
}

function getValidThroughDate(createdAt: string): string {
  const date = new Date(createdAt)
  date.setDate(date.getDate() + 30)
  return date.toISOString().split('T')[0]
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return ''
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case "'": return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}
