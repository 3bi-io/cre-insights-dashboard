import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createLogger } from '../_shared/logger.ts'
import { getServiceClient } from '../_shared/supabase-client.ts'

const logger = createLogger('indeed-xml-feed')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now();
  const requestIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  try {
    const supabaseClient = getServiceClient()

    // Parse URL for query parameters
    const url = new URL(req.url)
    const organizationId = url.searchParams.get('organization_id')

    // Fetch job listings with related data
    let query = supabaseClient
      .from('job_listings')
      .select(`
        *,
        job_categories:category_id(name),
        clients:client_id(name, company, email, city, state, zip_code)
      `)
      .eq('status', 'active')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })

    // Filter by organization_id if provided
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data: jobListings, error } = await query

    if (error) {
      throw error
    }

    // Generate Indeed XML
    const xmlHeader = '<?xml version="1.0" encoding="utf-8"?>'
    const xmlContent = generateIndeedXML(jobListings || [])

    const responseTime = Date.now() - startTime;

    // Log feed access (non-blocking)
    supabaseClient.from('feed_access_logs').insert({
      feed_type: 'indeed-xml-feed',
      platform: 'indeed',
      request_ip: requestIp,
      user_agent: userAgent,
      job_count: jobListings?.length || 0,
      response_time_ms: responseTime,
      organization_id: organizationId || null
    }).then(({ error }) => {
      if (error) logger.error('Failed to log feed access', error);
    });

    return new Response(xmlHeader + '\n' + xmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error: unknown) {
    logger.error('Error generating Indeed XML feed', error)
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

interface JobListing {
  id?: string;
  title?: string;
  job_title?: string;
  clients?: { company?: string; name?: string; email?: string; city?: string; state?: string; zip_code?: string };
  city?: string;
  state?: string;
  job_summary?: string;
  job_description?: string;
  job_categories?: { name?: string };
  job_type?: string;
  remote_type?: string;
  experience_level?: string;
  salary_min?: number;
  salary_max?: number;
  salary_type?: string;
  organization_id?: string;
  client_id?: string;
  created_at?: string;
}

function generateIndeedXML(jobs: JobListing[]): string {
  const xmlJobs = jobs.map(job => {
    const title = escapeXml(job.title || job.job_title || '')
    const company = escapeXml(job.clients?.company || job.clients?.name || job.client || 'Company Name')
    const city = escapeXml(job.city || job.clients?.city || '')
    const state = escapeXml(job.state || job.clients?.state || '')
    const postalcode = escapeXml(job.clients?.zip_code || '')
    const description = escapeXml(job.job_summary || job.job_description || '')
    const email = escapeXml(job.clients?.email || '')
    const category = escapeXml(job.job_categories?.name || '')
    const jobtype = escapeXml(job.job_type || 'fulltime')
    const remotetype = escapeXml(job.remote_type || '')
    const experience = escapeXml(job.experience_level || '')
    const referencenumber = escapeXml(job.id || '')
    // Build apply URL with client context and UTM attribution for proper routing
    let applyUrl = `https://applyai.jobs/apply?job_listing_id=${job.id}`;
    if (job.organization_id) applyUrl += `&organization_id=${job.organization_id}`;
    if (job.client_id) applyUrl += `&client_id=${job.client_id}`;
    applyUrl += '&utm_source=indeed&utm_medium=job_board';
    const url = escapeXml(applyUrl)
    
    // Format salary
    let salaryText = ''
    if (job.salary_min && job.salary_max) {
      const salaryType = job.salary_type || 'yearly'
      salaryText = `$${job.salary_min} - $${job.salary_max} per ${salaryType}`
    } else if (job.salary_min) {
      const salaryType = job.salary_type || 'yearly'
      salaryText = `$${job.salary_min}+ per ${salaryType}`
    }

    // Format date
    const dateFormatted = new Date(job.created_at).toUTCString()

    return `    <job>
        <title>
            <![CDATA[${title}]]>
        </title>
        <date>
            <![CDATA[${dateFormatted}]]>
        </date>
        <referencenumber>
            <![CDATA[${referencenumber}]]>
        </referencenumber>
        <url>
            <![CDATA[${url}]]>
        </url>
        <company>
            <![CDATA[${company}]]>
        </company>
        <sourcename>
            <![CDATA[${company}]]>
        </sourcename>
        <city>
            <![CDATA[${city}]]>
        </city>
        <state>
            <![CDATA[${state}]]>
        </state>
        <country>
            <![CDATA[US]]>
        </country>
        <postalcode>
            <![CDATA[${postalcode}]]>
        </postalcode>
        <email>
            <![CDATA[${email}]]>
        </email>
        <description>
            <![CDATA[${description}]]>
        </description>
        <salary>
            <![CDATA[${salaryText}]]>
        </salary>
        <jobtype>
            <![CDATA[${jobtype}]]>
        </jobtype>
        <category>
            <![CDATA[${category}]]>
        </category>
        <experience>
            <![CDATA[${experience}]]>
        </experience>
        <remotetype>
            <![CDATA[${remotetype}]]>
        </remotetype>
    </job>`
  }).join('\n')

  return `<source>
    <publisher>Apply AI</publisher>
    <publisherurl>https://applyai.jobs</publisherurl>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${xmlJobs}
</source>`
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