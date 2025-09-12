
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
      case 'everytruckjob':
        xmlContent = generateEveryTruckJobXML(jobListings || [])
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
    const id = escapeXml(job.id || '')
    const title = escapeXml(job.title || job.job_title || '')
    const description = escapeXml(job.job_summary || job.job_description || '')
    const location = formatLocation(job.location, job.city, job.state)
    const company = escapeXml(job.client || 'Company')
    const jobType = formatJobType(job.job_type)
    const experienceLevel = formatExperienceLevel(job.experience_level)
    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type)
    const applyUrl = escapeXml(job.apply_url || job.url || '')
    const validThrough = getValidThroughDate(job.created_at || new Date().toISOString())
    const datePosted = new Date(job.created_at || new Date()).toISOString().split('T')[0]

    return `    <job>
      <title>${title}</title>
      <location>
        <country>US</country>
        <region>${location}</region>
      </location>
      <description>${description}</description>
      <datePosted>${datePosted}</datePosted>
      <validThrough>${validThrough}</validThrough>
      <employmentType>${jobType}</employmentType>
      <hiringOrganization>
        <name>${company}</name>
      </hiringOrganization>
      <jobLocation>
        <address>
          <addressRegion>${location}</addressRegion>
          <addressCountry>US</addressCountry>
        </address>
      </jobLocation>
      <baseSalary>
        <currency>USD</currency>
        <value>${salary}</value>
      </baseSalary>
      <experienceRequirements>${experienceLevel}</experienceRequirements>
      <url>${applyUrl}</url>
      <identifier>
        <name>${company}</name>
        <value>${id}</value>
      </identifier>
    </job>`
  }).join('\n')

  return `<jobs xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
         xsi:noNamespaceSchemaLocation="https://www.google.com/schemas/sitemap-jobs/1.0/sitemap-jobs.xsd">
  <job_feed>
    <metadata>
      <generated_at>${new Date().toISOString()}</generated_at>
      <job_count>${jobs.length}</job_count>
    </metadata>
${xmlJobs}
  </job_feed>
</jobs>`
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
    const jobType = job.job_type || 'Full-Time'
    const applyUrl = escapeXml(job.apply_url || job.url || '')
    const datePosted = new Date(job.created_at || new Date()).toISOString().split('T')[0]
    
    return `    <job>
      <reference>${id}</reference>
      <title>${title}</title>
      <description>${description}</description>
      <location>${location}</location>
      <company>${company}</company>
      <jobtype>${jobType}</jobtype>
      <url>${applyUrl}</url>
      <date>${datePosted}</date>
    </job>`
  }).join('\n')

  return `<source>
  <publisher>Your Company</publisher>
  <publisherurl>https://yourcompany.com</publisherurl>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${xmlJobs}
</source>`
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
    
    return `  <job id="${id}">
    <title>${title}</title>
    <description>${description}</description>
    <location>${location}</location>
    <company>${company}</company>
    <employmentType>${jobType}</employmentType>
    <applicationUrl>${applyUrl}</applicationUrl>
    <datePosted>${datePosted}</datePosted>
    <salary>${salary}</salary>
  </job>`
  }).join('\n')

  return `<jobs>
  <source>Your Company Jobs Feed</source>
  <version>1.0</version>
  <generatedAt>${new Date().toISOString()}</generatedAt>
${xmlJobs}
</jobs>`
}

function generateDiceXML(jobs: any[]): string {
  const xmlJobs = jobs.map(job => {
    const id = escapeXml(job.id || '')
    const title = escapeXml(job.title || job.job_title || '')
    const description = escapeXml(job.job_summary || job.job_description || '')
    const location = formatLocation(job.location, job.city, job.state)
    const company = escapeXml(job.client || 'Company')
    const applyUrl = escapeXml(job.apply_url || job.url || '')
    const skills = job.job_categories?.name || 'Technology'
    
    return `  <job>
    <jobId>${id}</jobId>
    <jobTitle>${title}</jobTitle>
    <jobDescription>${description}</jobDescription>
    <jobLocation>${location}</jobLocation>
    <company>${company}</company>
    <skills>${skills}</skills>
    <applyUrl>${applyUrl}</applyUrl>
    <datePosted>${new Date(job.created_at || new Date()).toISOString().split('T')[0]}</datePosted>
  </job>`
  }).join('\n')

  return `<jobfeed>
  <metadata>
    <partner>Your Company</partner>
    <generatedDate>${new Date().toISOString()}</generatedDate>
    <jobCount>${jobs.length}</jobCount>
  </metadata>
${xmlJobs}
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

function generateEveryTruckJobXML(jobs: any[]): string {
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
    const cdlClass = extractCDLClass(job.title, job.job_summary)
    const experience = extractExperienceRequirement(job.job_summary)
    const benefits = extractBenefits(job.job_summary)
    const applyUrl = escapeXml(job.apply_url || job.url || '')
    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type)
    
    return `  <position>
    <id>${id}</id>
    <jobTitle>${title}</jobTitle>
    <jobDescription>${description}</jobDescription>
    <location>${location}</location>
    <employer>${company}</employer>
    <cdlClass>${cdlClass}</cdlClass>
    <experienceRequired>${experience}</experienceRequired>
    <benefits>${benefits}</benefits>
    <compensation>${salary}</compensation>
    <applicationUrl>${applyUrl}</applicationUrl>
    <postedDate>${new Date(job.created_at || new Date()).toISOString().split('T')[0]}</postedDate>
  </position>`
  }).join('\n')

  return `<jobFeed xmlns="http://everytruckjob.com/schema/jobs">
  <metadata>
    <publisher>CDL Jobs Feed</publisher>
    <publishDate>${new Date().toISOString()}</publishDate>
    <jobCount>${truckingJobs.length}</jobCount>
  </metadata>
${xmlJobs}
</jobFeed>`
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
