
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

    // Build query for job listings (include ALL active jobs)
    const selectFields = `
      *,
      job_categories:category_id(name)
    `

    let query = supabaseClient
      .from('job_listings')
      .select(selectFields)
      .eq('status', 'active')


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
  // Build a standard XML Sitemap for job postings (URLs only)
  const uniqueUrls = Array.from(
    new Set(
      (jobs || [])
        .map((job) => (job.url || job.apply_url || '').trim())
        .filter(Boolean)
    )
  ) as string[]

  const urlEntries = (jobs || [])
    .map((job) => {
      const loc = (job.url || job.apply_url || '').trim()
      if (!loc) return ''
      const lastmod = new Date(job.updated_at || job.created_at || new Date()).toISOString().split('T')[0]
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`
    })
    .filter(Boolean)

  // De-duplicate while preserving first occurrence lastmod
  const seen = new Set<string>()
  const deduped = urlEntries.filter((entry) => {
    const match = entry.match(/<loc>(.*?)<\/loc>/)
    const loc = match?.[1] || ''
    if (!loc || seen.has(loc)) return false
    seen.add(loc)
    return true
  })

  return `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${deduped.join('\n')}\n</urlset>`
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
