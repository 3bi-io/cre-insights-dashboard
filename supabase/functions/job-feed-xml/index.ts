import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { createLogger } from '../_shared/logger.ts'

const logger = createLogger('job-feed-xml')

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
      .eq('is_hidden', false)


    // Filter by user if specified
    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    query = query.order('created_at', { ascending: false })

    const { data: jobListings, error } = await query

    if (error) {
      throw error
    }

    // Validate XML feed before generation
    const validation = validateXMLFeed(platform, jobListings || [])
    if (validation.warnings.length > 0) {
      logger.warn('XML Feed Validation Warnings', { warnings: validation.warnings })
    }

    // Generate XML based on platform
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>'
    let xmlContent: string
    
    switch (platform?.toLowerCase()) {
      case 'google jobs':
        xmlContent = generateGoogleJobsXML(jobListings || [])
        break
      case 'simplyhired':
        xmlContent = generateSimplyHiredXML(jobListings || [])
        break
      case 'craigslist':
        xmlContent = generateCraigslistXML(jobListings || [])
        break
      case 'glassdoor':
        xmlContent = generateGlassdoorXML(jobListings || [])
        break
      case 'dice':
        xmlContent = generateDiceXML(jobListings || [])
        break
      case 'jooble':
        xmlContent = generateJoobleXML(jobListings || [])
        break
      case 'truck-driver-jobs-411':
        xmlContent = generateTruckDriverJobs411XML(jobListings || [])
        break
      case 'newjobs4you':
        xmlContent = generateNewJobs4YouXML(jobListings || [])
        break
      case 'roadwarriors':
        xmlContent = generateRoadWarriorsXML(jobListings || [])
        break
      default:
        xmlContent = generateJobFeedXML(jobListings || [])
    }

    const responseTime = Date.now() - startTime;

    // Get organization_id for the user
    let organizationId = null;
    if (user_id) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('organization_id')
        .eq('id', user_id)
        .single();
      organizationId = profile?.organization_id;
    }

    // Log feed access (non-blocking)
    supabaseClient.from('feed_access_logs').insert({
      organization_id: organizationId,
      user_id: user_id,
      feed_type: 'job-feed-xml',
      platform: platform,
      request_ip: requestIp,
      user_agent: userAgent,
      job_count: jobListings?.length || 0,
      response_time_ms: responseTime
    }).catch(err => logger.error('Failed to log feed access', err));

    return new Response(xmlHeader + '\n' + xmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error: unknown) {
    logger.error('Error generating XML feed', error)
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
  // NOTE: Google Jobs primarily uses JSON-LD structured data, not XML feeds
  // This generates a job sitemap for crawling pages with JobPosting structured data
  const xmlJobs = jobs.map(job => {
    const applyUrl = escapeXml(job.apply_url || job.url || '#')
    const lastMod = new Date(job.updated_at || job.created_at || new Date()).toISOString().split('T')[0]

    return `  <url>
    <loc>${applyUrl}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  }).join('\n')

  return `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<!-- Job Sitemap for Google Jobs - Pages should contain JobPosting JSON-LD -->
<!-- Generated: ${new Date().toISOString()} -->
<!-- Job Count: ${jobs.length} -->
${xmlJobs}
</urlset>`
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

// Platform-specific XML generators
function generateSimplyHiredXML(jobs: any[]): string {
  const xmlJobs = jobs.map(job => {
    const id = escapeXml(job.id || '')
    const title = escapeXml(job.title || job.job_title || '')
    const description = escapeXml(job.job_summary || job.job_description || '')
    const location = formatLocation(job.location, job.city, job.state)
    const company = escapeXml(job.client || 'Company')
    const jobType = formatSimplyHiredJobType(job.job_type)
    const applyUrl = escapeXml(job.apply_url || job.url || '')
    const datePosted = new Date(job.created_at || new Date()).toISOString().split('T')[0]
    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type)
    
    return `    <job>
      <reference>${id}</reference>
      <title>${title}</title>
      <description><![CDATA[${job.job_summary || job.job_description || ''}]]></description>
      <location>${location}</location>
      <company>${company}</company>
      <jobtype>${jobType}</jobtype>
      <url>${applyUrl}</url>
      <date>${datePosted}</date>
      <salary>${salary}</salary>
    </job>`
  }).join('\n')

  return `<source>
  <publisher>Job Feed Publisher</publisher>
  <publisherurl>https://yourcompany.com</publisherurl>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <count>${jobs.length}</count>
${xmlJobs}
</source>`
}

function formatSimplyHiredJobType(jobType?: string): string {
  const typeMap: { [key: string]: string } = {
    'full-time': 'Full-Time',
    'full_time': 'Full-Time', 
    'part-time': 'Part-Time',
    'part_time': 'Part-Time',
    'contract': 'Contract',
    'contractor': 'Contract',
    'temporary': 'Temporary',
    'temp': 'Temporary',
    'internship': 'Internship',
    'intern': 'Internship'
  }
  return typeMap[jobType?.toLowerCase() || ''] || 'Full-Time'
}

function generateCraigslistXML(jobs: any[]): string {
  const xmlJobs = jobs.map(job => {
    const title = escapeXml(job.title || job.job_title || '')
    const description = escapeXml(job.job_summary || job.job_description || '')
    const location = formatLocation(job.location, job.city, job.state)
    const compensation = formatSalary(job.salary_min, job.salary_max, job.salary_type)
    const applyUrl = escapeXml(job.apply_url || job.url || '')
    
    return `    <item>
      <title>${title} - ${location}</title>
      <description>${description}</description>
      <compensation>${compensation}</compensation>
      <link>${applyUrl}</link>
      <pubDate>${new Date(job.created_at || new Date()).toUTCString()}</pubDate>
    </item>`
  }).join('\n')

  return `<rss version="2.0">
  <channel>
    <title>Job Listings Feed</title>
    <description>Current job openings</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${xmlJobs}
  </channel>
</rss>`
}

function generateGlassdoorXML(jobs: any[]): string {
  // NOTE: Glassdoor primarily uses API integration, not XML feeds
  // This generates a generic XML format that could be adapted for their needs
  const xmlJobs = jobs.map(job => {
    const id = escapeXml(job.id || '')
    const title = escapeXml(job.title || job.job_title || '')
    const description = escapeXml(job.job_summary || job.job_description || '')
    const location = formatLocation(job.location, job.city, job.state)
    const company = escapeXml(job.client || 'Company')
    const jobType = formatJobType(job.job_type)
    const applyUrl = escapeXml(job.apply_url || job.url || '')
    const datePosted = new Date(job.created_at || new Date()).toISOString()
    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type)
    
    return `  <job>
    <jobId>${id}</jobId>
    <title>${title}</title>
    <description><![CDATA[${job.job_summary || job.job_description || ''}]]></description>
    <location>
      <city>${escapeXml(job.city || '')}</city>
      <state>${escapeXml(job.state || '')}</state>
      <country>US</country>
    </location>
    <company>${company}</company>
    <employmentType>${jobType}</employmentType>
    <applicationUrl>${applyUrl}</applicationUrl>
    <datePosted>${datePosted}</datePosted>
    <salary>${salary}</salary>
    <category>${escapeXml(job.job_categories?.name || 'General')}</category>
  </job>`
  }).join('\n')

  return `<jobs>
  <source>Job Feed for Glassdoor Integration</source>
  <version>1.0</version>
  <generatedAt>${new Date().toISOString()}</generatedAt>
  <jobCount>${jobs.length}</jobCount>
${xmlJobs}
</jobs>`
}

function generateDiceXML(jobs: any[]): string {
  // Filter for technology-related jobs for Dice
  const techJobs = jobs.filter(job => 
    job.title?.toLowerCase().includes('developer') || 
    job.title?.toLowerCase().includes('engineer') ||
    job.title?.toLowerCase().includes('programmer') ||
    job.title?.toLowerCase().includes('analyst') ||
    job.job_categories?.name?.toLowerCase().includes('technology') ||
    job.job_categories?.name?.toLowerCase().includes('software') ||
    job.job_categories?.name?.toLowerCase().includes('it')
  )

  const xmlJobs = techJobs.map(job => {
    const id = escapeXml(job.id || '')
    const title = escapeXml(job.title || job.job_title || '')
    const description = escapeXml(job.job_summary || job.job_description || '')
    const location = formatLocation(job.location, job.city, job.state)
    const company = escapeXml(job.client || 'Company')
    const applyUrl = escapeXml(job.apply_url || job.url || '')
    const skills = escapeXml(job.job_categories?.name || 'Technology')
    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type)
    
    return `  <job>
    <jobId>${id}</jobId>
    <jobTitle>${title}</jobTitle>
    <jobDescription><![CDATA[${job.job_summary || job.job_description || ''}]]></jobDescription>
    <jobLocation>${location}</jobLocation>
    <company>${company}</company>
    <skills>${skills}</skills>
    <salary>${salary}</salary>
    <applyUrl>${applyUrl}</applyUrl>
    <datePosted>${new Date(job.created_at || new Date()).toISOString().split('T')[0]}</datePosted>
    <employmentType>${formatJobType(job.job_type)}</employmentType>
  </job>`
  }).join('\n')

  return `<jobfeed>
  <metadata>
    <partner>Technology Job Feed</partner>
    <generatedDate>${new Date().toISOString()}</generatedDate>
    <jobCount>${techJobs.length}</jobCount>
    <totalSubmitted>${jobs.length}</totalSubmitted>
  </metadata>
  <jobs>
${xmlJobs}
  </jobs>
</jobfeed>`
}

function generateJoobleXML(jobs: any[]): string {
  const xmlJobs = jobs.map(job => {
    const id = escapeXml(job.id || '')
    const title = escapeXml(job.title || job.job_title || '')
    const description = escapeXml(job.job_summary || job.job_description || '')
    const location = formatLocation(job.location, job.city, job.state)
    const company = escapeXml(job.client || 'Company')
    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type)
    const applyUrl = escapeXml(job.apply_url || job.url || '')
    const datePosted = new Date(job.created_at || new Date()).toISOString().split('T')[0]
    
    return `  <vacancy>
    <id>${id}</id>
    <title>${title}</title>
    <description>${description}</description>
    <salary>${salary}</salary>
    <location>
      <country>US</country>
      <region>${location}</region>
    </location>
    <company>${company}</company>
    <url>${applyUrl}</url>
    <date>${datePosted}</date>
  </vacancy>`
  }).join('\n')

  return `<vacancies>
  <publisher>
    <name>Your Company</name>
    <url>https://yourcompany.com</url>
  </publisher>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${xmlJobs}
</vacancies>`
}

// Trucking platform-specific XML generators
function generateTruckDriverJobs411XML(jobs: any[]): string {
  const truckingJobs = jobs.filter(job => 
    job.title?.toLowerCase().includes('driver') || 
    job.title?.toLowerCase().includes('cdl') ||
    job.title?.toLowerCase().includes('truck')
  )

  const xmlJobs = truckingJobs.map(job => {
    const id = escapeXml(job.id || '')
    const title = escapeXml(job.title || job.job_title || '')
    const description = escapeXml(job.job_summary || job.job_description || '')
    const location = formatLocation(job.location, job.city, job.state)
    const company = escapeXml(job.client || 'Company')
    const jobType = formatTruckingJobType(job.job_type)
    const cdlRequired = extractCDLRequirement(job.title, job.job_summary)
    const routeType = extractRouteType(job.job_summary)
    const homeTime = extractHomeTime(job.job_summary)
    const applyUrl = escapeXml(job.apply_url || job.url || '')
    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type)
    
    return `  <job>
    <jobId>${id}</jobId>
    <title>${title}</title>
    <description>${description}</description>
    <location>${location}</location>
    <company>${company}</company>
    <jobType>${jobType}</jobType>
    <cdlRequired>${cdlRequired}</cdlRequired>
    <routeType>${routeType}</routeType>
    <homeTime>${homeTime}</homeTime>
    <salary>${salary}</salary>
    <applyUrl>${applyUrl}</applyUrl>
    <datePosted>${new Date(job.created_at || new Date()).toISOString().split('T')[0]}</datePosted>
  </job>`
  }).join('\n')

  return `<truckDriverJobs>
  <source>
    <name>CDL Job Feed</name>
    <url>https://yourcompany.com</url>
    <generatedAt>${new Date().toISOString()}</generatedAt>
  </source>
${xmlJobs}
</truckDriverJobs>`
}


function generateNewJobs4YouXML(jobs: any[]): string {
  const transportationJobs = jobs.filter(job => 
    job.title?.toLowerCase().includes('driver') || 
    job.title?.toLowerCase().includes('transport') ||
    job.title?.toLowerCase().includes('logistics')
  )

  const xmlJobs = transportationJobs.map(job => {
    const id = escapeXml(job.id || '')
    const title = escapeXml(job.title || job.job_title || '')
    const description = escapeXml(job.job_summary || job.job_description || '')
    const location = formatLocation(job.location, job.city, job.state)
    const company = escapeXml(job.client || 'Company')
    const category = 'Transportation'
    const applyUrl = escapeXml(job.apply_url || job.url || '')
    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type)
    
    return `    <job id="${id}">
      <title>${title}</title>
      <description>${description}</description>
      <category>${category}</category>
      <location>${location}</location>
      <company>${company}</company>
      <salary>${salary}</salary>
      <url>${applyUrl}</url>
      <datePosted>${new Date(job.created_at || new Date()).toISOString().split('T')[0]}</datePosted>
    </job>`
  }).join('\n')

  return `<jobs>
  <feed>
    <title>Transportation Jobs Feed</title>
    <description>Current transportation and logistics opportunities</description>
    <lastUpdated>${new Date().toISOString()}</lastUpdated>
  </feed>
${xmlJobs}
</jobs>`
}

function generateRoadWarriorsXML(jobs: any[]): string {
  const driverJobs = jobs.filter(job => 
    job.title?.toLowerCase().includes('driver') || 
    job.title?.toLowerCase().includes('cdl') ||
    job.title?.toLowerCase().includes('otr') ||
    job.title?.toLowerCase().includes('regional')
  )

  const xmlJobs = driverJobs.map(job => {
    const id = escapeXml(job.id || '')
    const title = escapeXml(job.title || job.job_title || '')
    const description = escapeXml(job.job_summary || job.job_description || '')
    const location = formatLocation(job.location, job.city, job.state)
    const company = escapeXml(job.client || 'Company')
    const routeType = extractRouteType(job.job_summary)
    const truckType = extractTruckType(job.job_summary)
    const applyUrl = escapeXml(job.apply_url || job.url || '')
    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type)
    
    return `  <driverPosition>
    <positionId>${id}</positionId>
    <jobTitle>${title}</jobTitle>
    <jobDescription>${description}</jobDescription>
    <location>${location}</location>
    <company>${company}</company>
    <routeType>${routeType}</routeType>
    <truckType>${truckType}</truckType>
    <payPackage>${salary}</payPackage>
    <applyLink>${applyUrl}</applyLink>
    <publishDate>${new Date(job.created_at || new Date()).toISOString().split('T')[0]}</publishDate>
  </driverPosition>`
  }).join('\n')

  return `<driverJobs>
  <community>RoadWarriors</community>
  <feedInfo>
    <generated>${new Date().toISOString()}</generated>
    <totalPositions>${driverJobs.length}</totalPositions>
  </feedInfo>
${xmlJobs}
</driverJobs>`
}

// Helper functions for trucking-specific data extraction
function formatTruckingJobType(jobType?: string): string {
  const truckingTypes: { [key: string]: string } = {
    'full-time': 'Full-Time Driver',
    'part-time': 'Part-Time Driver',
    'contract': 'Owner Operator',
    'temporary': 'Temporary Driver',
    'otr': 'Over The Road',
    'regional': 'Regional Driver',
    'local': 'Local Driver'
  }
  return truckingTypes[jobType?.toLowerCase() || ''] || 'Full-Time Driver'
}

function extractCDLRequirement(title?: string, description?: string): string {
  const text = `${title} ${description}`.toLowerCase()
  if (text.includes('cdl a') || text.includes('class a')) return 'CDL Class A'
  if (text.includes('cdl b') || text.includes('class b')) return 'CDL Class B'
  if (text.includes('cdl c') || text.includes('class c')) return 'CDL Class C'
  if (text.includes('cdl')) return 'CDL Required'
  return 'CDL Preferred'
}

function extractCDLClass(title?: string, description?: string): string {
  const text = `${title} ${description}`.toLowerCase()
  if (text.includes('class a') || text.includes('cdl a')) return 'A'
  if (text.includes('class b') || text.includes('cdl b')) return 'B'
  if (text.includes('class c') || text.includes('cdl c')) return 'C'
  return 'A'
}

function extractRouteType(description?: string): string {
  const text = description?.toLowerCase() || ''
  if (text.includes('otr') || text.includes('over the road')) return 'OTR'
  if (text.includes('regional')) return 'Regional'
  if (text.includes('local') || text.includes('home daily')) return 'Local'
  if (text.includes('dedicated')) return 'Dedicated'
  return 'Regional'
}

function extractHomeTime(description?: string): string {
  const text = description?.toLowerCase() || ''
  if (text.includes('home daily') || text.includes('daily home time')) return 'Home Daily'
  if (text.includes('home weekly') || text.includes('weekends home')) return 'Home Weekly'
  if (text.includes('home every other week')) return 'Home Bi-weekly'
  if (text.includes('2 weeks out')) return '2 Weeks Out'
  return 'Varies'
}

function extractExperienceRequirement(description?: string): string {
  const text = description?.toLowerCase() || ''
  if (text.includes('no experience') || text.includes('entry level')) return 'Entry Level'
  if (text.includes('1 year') || text.includes('12 months')) return '1+ Years'
  if (text.includes('2 years') || text.includes('24 months')) return '2+ Years'
  if (text.includes('3 years')) return '3+ Years'
  if (text.includes('5 years')) return '5+ Years'
  return '1+ Years'
}

function extractBenefits(description?: string): string {
  const text = description?.toLowerCase() || ''
  const benefits = []
  if (text.includes('health insurance')) benefits.push('Health Insurance')
  if (text.includes('401k') || text.includes('retirement')) benefits.push('401k')
  if (text.includes('paid time off') || text.includes('pto')) benefits.push('PTO')
  if (text.includes('dental')) benefits.push('Dental')
  if (text.includes('vision')) benefits.push('Vision')
  return benefits.join(', ') || 'Competitive Benefits'
}

function extractTruckType(description?: string): string {
  const text = description?.toLowerCase() || ''
  if (text.includes('flatbed')) return 'Flatbed'
  if (text.includes('dry van')) return 'Dry Van'
  if (text.includes('refrigerated') || text.includes('reefer')) return 'Refrigerated'
  if (text.includes('tanker')) return 'Tanker'
  if (text.includes('car hauler')) return 'Auto Transport'
  return 'Dry Van'
}

// XML validation helper function
function validateXMLFeed(platform: string, jobs: any[]): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = []
  
  // Check job count
  if (!jobs || jobs.length === 0) {
    warnings.push('No active jobs found for XML feed generation')
  }

  // Platform-specific validations
  switch (platform?.toLowerCase()) {
    case 'google jobs':
      jobs.forEach((job, index) => {
        if (!job.apply_url && !job.url) {
          warnings.push(`Job ${index + 1}: Missing apply URL for Google Jobs`)
        }
        if (!job.title) {
          warnings.push(`Job ${index + 1}: Missing job title`)
        }
      })
      break
      
    case 'indeed':
      jobs.forEach((job, index) => {
        if (!job.city || !job.state) {
          warnings.push(`Job ${index + 1}: Indeed requires city and state`)
        }
        if (!job.client && !job.company) {
          warnings.push(`Job ${index + 1}: Indeed requires company name`)
        }
      })
      break
      
    case 'craigslist':
      jobs.forEach((job, index) => {
        if (!job.title) {
          warnings.push(`Job ${index + 1}: Craigslist requires job title`)
        }
        if (!job.job_summary && !job.job_description) {
          warnings.push(`Job ${index + 1}: Craigslist requires job description`)
        }
      })
      break

    case 'truck-driver-jobs-411':
      const driverJobs = jobs.filter(job => 
        job.title?.toLowerCase().includes('driver') || 
        job.title?.toLowerCase().includes('cdl') ||
        job.title?.toLowerCase().includes('truck')
      )
      if (driverJobs.length === 0) {
        warnings.push('No driver/CDL jobs found for trucking platform')
      }
      break
  }

  return {
    isValid: warnings.length === 0,
    warnings
  }
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
