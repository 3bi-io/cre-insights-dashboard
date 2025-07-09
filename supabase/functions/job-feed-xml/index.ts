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
    // Create Supabase client with service role to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Fetch job listings with related data
    const { data: jobListings, error } = await supabaseClient
      .from('job_listings')
      .select(`
        *,
        job_categories:category_id(name)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Generate XML
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>'
    const xmlContent = generateJobFeedXML(jobListings || [])

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
    const title = escapeXml(job.title || job.job_title || '')
    const description = escapeXml(job.description || job.job_description || '')
    const location = escapeXml(job.location || `${job.city || ''}, ${job.state || ''}`.trim().replace(/^,\s*|,\s*$/, '') || '')
    const category = escapeXml(job.job_categories?.name || '')
    const client = escapeXml(job.client || '')
    const salaryMin = job.salary_min ? `<salary_min>${job.salary_min}</salary_min>` : ''
    const salaryMax = job.salary_max ? `<salary_max>${job.salary_max}</salary_max>` : ''
    const salaryType = job.salary_type ? `<salary_type>${escapeXml(job.salary_type)}</salary_type>` : ''
    const url = job.url ? `<url>${escapeXml(job.url)}</url>` : ''
    const jobId = job.job_id ? `<job_id>${escapeXml(job.job_id)}</job_id>` : ''

    return `    <job>
      <id>${job.id}</id>
      <title>${title}</title>
      <description>${description}</description>
      <location>${location}</location>
      <category>${category}</category>
      <client>${client}</client>
      <status>${job.status}</status>
      <experience_level>${job.experience_level || ''}</experience_level>
      <remote_type>${job.remote_type || ''}</remote_type>
      ${salaryMin}
      ${salaryMax}
      ${salaryType}
      <budget>${job.budget || 0}</budget>
      ${jobId}
      ${url}
      <created_at>${job.created_at}</created_at>
      <updated_at>${job.updated_at}</updated_at>
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