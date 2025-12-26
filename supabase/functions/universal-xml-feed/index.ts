import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobListing {
  id: string;
  title: string;
  description: string;
  location?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  salary_min?: number;
  salary_max?: number;
  salary_type?: string;
  job_type?: string;
  experience_level?: string;
  created_at: string;
  updated_at?: string;
  apply_url?: string;
  category_name?: string;
  client_name?: string;
  company?: string;
  client_email?: string;
  organization_id: string;
  client_id?: string;
  remote_type?: string;
  requirements?: string;
  benefits?: string;
}

// Supported feed formats
const VALID_FORMATS = [
  'indeed',      // Indeed XML format
  'google',      // Google Jobs sitemap format
  'generic',     // Generic XML format
  'talent',      // Talent.com (Neuvoo) format
  'careerjet',   // CareerJet format
  'trovit',      // Trovit format
  'adzuna',      // Adzuna format
  'dice',        // Dice format (tech jobs)
  'simplyhired', // SimplyHired (uses Indeed format)
  'jooble',      // Jooble format
];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organization_id');
  const clientId = url.searchParams.get('client_id');
  const format = url.searchParams.get('format') || 'generic';
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  console.log('Universal XML Feed Request:', { organizationId, clientId, format });

  try {
    // Validate required parameters
    if (!organizationId) {
      return new Response(
        generateErrorXML('Missing required parameter: organization_id'),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
        }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(organizationId)) {
      return new Response(
        generateErrorXML('Invalid organization_id format'),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
        }
      );
    }

    if (clientId && !uuidRegex.test(clientId)) {
      return new Response(
        generateErrorXML('Invalid client_id format'),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
        }
      );
    }

    // Validate format
    if (!VALID_FORMATS.includes(format)) {
      return new Response(
        generateErrorXML(`Invalid format. Must be one of: ${VALID_FORMATS.join(', ')}`),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
        }
      );
    }

    // Initialize Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Database-based rate limiting using feed_access_logs
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count: recentRequests } = await supabase
      .from('feed_access_logs')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', clientIP)
      .eq('feed_type', 'universal-xml-feed')
      .gte('created_at', oneHourAgo);

    if ((recentRequests || 0) >= 1000) {
      console.log('Rate limit exceeded for IP:', clientIP);
      return new Response(
        generateErrorXML('Rate limit exceeded. Maximum 1000 requests per hour.'),
        {
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/xml',
            'Retry-After': '3600'
          }
        }
      );
    }

    // Build query
    let query = supabase
      .from('job_listings')
      .select(`
        *,
        job_categories(name),
        clients(name, company, email, city, state, zip_code)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Add client filter if provided
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return new Response(
        generateErrorXML('Failed to fetch job listings'),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
        }
      );
    }

    // Transform data for XML generation
    const transformedJobs: JobListing[] = (jobs || []).map((job: any) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      location: job.location,
      city: job.city || job.clients?.city,
      state: job.state || job.clients?.state,
      zip_code: job.zip_code || job.clients?.zip_code,
      country: job.country || 'US',
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_type: job.salary_type,
      job_type: job.job_type,
      experience_level: job.experience_level,
      created_at: job.created_at,
      updated_at: job.updated_at,
      apply_url: job.apply_url,
      category_name: job.job_categories?.name,
      client_name: job.clients?.name,
      company: job.clients?.company,
      client_email: job.clients?.email,
      organization_id: job.organization_id,
      client_id: job.client_id,
      remote_type: job.remote_type,
      requirements: job.requirements,
      benefits: job.benefits,
    }));

    // Generate XML based on format
    let xmlContent: string;
    switch (format) {
      case 'indeed':
      case 'simplyhired':
        xmlContent = generateIndeedXML(transformedJobs);
        break;
      case 'google':
        xmlContent = generateGoogleJobsXML(transformedJobs, organizationId);
        break;
      case 'talent':
        xmlContent = generateTalentXML(transformedJobs);
        break;
      case 'careerjet':
        xmlContent = generateCareerJetXML(transformedJobs);
        break;
      case 'trovit':
        xmlContent = generateTrovitXML(transformedJobs);
        break;
      case 'adzuna':
        xmlContent = generateAdzunaXML(transformedJobs);
        break;
      case 'dice':
        xmlContent = generateDiceXML(transformedJobs);
        break;
      case 'jooble':
        xmlContent = generateJoobleXML(transformedJobs);
        break;
      default:
        xmlContent = generateGenericXML(transformedJobs);
    }

    const responseTime = Date.now() - startTime;

    // Log feed access
    const userAgent = req.headers.get('user-agent') || 'unknown';
    await supabase.from('feed_access_logs').insert({
      feed_type: 'universal-xml-feed',
      format: format,
      organization_id: organizationId,
      client_id: clientId,
      job_count: transformedJobs.length,
      ip_address: clientIP,
      user_agent: userAgent,
      response_time_ms: responseTime,
    });

    console.log('Feed generated successfully:', {
      format,
      jobCount: transformedJobs.length,
      responseTime
    });

    return new Response(xmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });

  } catch (error) {
    console.error('Error generating feed:', error);
    return new Response(
      generateErrorXML('Internal server error'),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
      }
    );
  }
});

// ============ XML GENERATORS ============

function generateIndeedXML(jobs: JobListing[]): string {
  const jobsXML = jobs.map(job => {
    const company = escapeXML(job.company || job.client_name || 'Company');
    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);
    const jobUrl = escapeXML(`https://ats.me/jobs/${job.id}`);
    
    return `    <job>
      <title>${escapeXML(job.title)}</title>
      <date>${new Date(job.created_at).toISOString().split('T')[0]}</date>
      <referencenumber>${escapeXML(job.id)}</referencenumber>
      <url>${jobUrl}</url>
      <company>${company}</company>
      <city>${escapeXML(job.city || 'Remote')}</city>
      <state>${escapeXML(job.state || '')}</state>
      <country>${escapeXML(job.country || 'US')}</country>
      <postalcode>${escapeXML(job.zip_code || '')}</postalcode>
      <description><![CDATA[${job.description || ''}]]></description>
      ${salary ? `<salary>${escapeXML(salary)}</salary>` : ''}
      ${job.job_type ? `<jobtype>${escapeXML(mapJobType(job.job_type))}</jobtype>` : ''}
      ${job.category_name ? `<category>${escapeXML(job.category_name)}</category>` : ''}
      ${job.experience_level ? `<experience>${escapeXML(job.experience_level)}</experience>` : ''}
    </job>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<source>
  <publisher>ATS.me</publisher>
  <publisherurl>https://ats.me</publisherurl>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  ${jobsXML}
</source>`;
}

function generateGoogleJobsXML(jobs: JobListing[], organizationId: string): string {
  const jobsXML = jobs.map(job => {
    const jobUrl = escapeXML(`https://ats.me/jobs/${job.id}`);
    
    return `  <url>
    <loc>${jobUrl}</loc>
    <lastmod>${new Date(job.updated_at || job.created_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${jobsXML}
</urlset>`;
}

function generateTalentXML(jobs: JobListing[]): string {
  const jobsXML = jobs.map(job => {
    const company = escapeXML(job.company || job.client_name || 'Company');
    const jobUrl = escapeXML(`https://ats.me/jobs/${job.id}`);
    const applyUrl = escapeXML(job.apply_url || `https://ats.me/apply/${job.id}`);
    
    return `  <job>
    <title>${escapeXML(job.title)}</title>
    <date>${new Date(job.created_at).toISOString().split('T')[0]}</date>
    <referencenumber>${escapeXML(job.id)}</referencenumber>
    <url>${jobUrl}</url>
    <apply_url>${applyUrl}</apply_url>
    <company>${company}</company>
    <city>${escapeXML(job.city || '')}</city>
    <state>${escapeXML(job.state || '')}</state>
    <country>${escapeXML(job.country || 'US')}</country>
    <postalcode>${escapeXML(job.zip_code || '')}</postalcode>
    <description><![CDATA[${job.description || ''}]]></description>
    ${job.salary_min ? `<salary_min>${job.salary_min}</salary_min>` : ''}
    ${job.salary_max ? `<salary_max>${job.salary_max}</salary_max>` : ''}
    ${job.salary_type ? `<salary_type>${escapeXML(job.salary_type)}</salary_type>` : ''}
    ${job.job_type ? `<jobtype>${escapeXML(mapJobType(job.job_type))}</jobtype>` : ''}
    ${job.category_name ? `<category>${escapeXML(job.category_name)}</category>` : ''}
    ${job.remote_type ? `<remotetype>${escapeXML(job.remote_type)}</remotetype>` : ''}
  </job>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<jobs>
  <publisher>ATS.me</publisher>
  <publisherurl>https://ats.me</publisherurl>
  <lastBuildDate>${new Date().toISOString()}</lastBuildDate>
${jobsXML}
</jobs>`;
}

function generateCareerJetXML(jobs: JobListing[]): string {
  const jobsXML = jobs.map(job => {
    const company = escapeXML(job.company || job.client_name || 'Company');
    const jobUrl = escapeXML(`https://ats.me/jobs/${job.id}`);
    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);
    
    return `  <offer>
    <name>${escapeXML(job.title)}</name>
    <date>${new Date(job.created_at).toISOString().split('T')[0]}</date>
    <id>${escapeXML(job.id)}</id>
    <url>${jobUrl}</url>
    <company>${company}</company>
    <location>${escapeXML(formatLocation(job.location, job.city, job.state))}</location>
    <description><![CDATA[${job.description || ''}]]></description>
    ${salary ? `<salary>${escapeXML(salary)}</salary>` : ''}
    ${job.job_type ? `<type>${escapeXML(mapJobType(job.job_type))}</type>` : ''}
  </offer>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<jobs>
  <publisher>ATS.me</publisher>
  <last_build_date>${new Date().toISOString()}</last_build_date>
${jobsXML}
</jobs>`;
}

function generateTrovitXML(jobs: JobListing[]): string {
  const jobsXML = jobs.map(job => {
    const company = escapeXML(job.company || job.client_name || 'Company');
    const jobUrl = escapeXML(`https://ats.me/jobs/${job.id}`);
    
    return `  <ad>
    <id>${escapeXML(job.id)}</id>
    <title>${escapeXML(job.title)}</title>
    <url>${jobUrl}</url>
    <company>${company}</company>
    <content><![CDATA[${job.description || ''}]]></content>
    <city>${escapeXML(job.city || '')}</city>
    <region>${escapeXML(job.state || '')}</region>
    <postcode>${escapeXML(job.zip_code || '')}</postcode>
    <country>${escapeXML(job.country || 'US')}</country>
    <date>${new Date(job.created_at).toISOString().split('T')[0]}</date>
    ${job.salary_min ? `<salary>${job.salary_min}</salary>` : ''}
    ${job.job_type ? `<contract>${escapeXML(mapJobType(job.job_type))}</contract>` : ''}
    ${job.category_name ? `<category>${escapeXML(job.category_name)}</category>` : ''}
  </ad>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<trovit>
${jobsXML}
</trovit>`;
}

function generateAdzunaXML(jobs: JobListing[]): string {
  const jobsXML = jobs.map(job => {
    const company = escapeXML(job.company || job.client_name || 'Company');
    const jobUrl = escapeXML(`https://ats.me/jobs/${job.id}`);
    const applyUrl = escapeXML(job.apply_url || `https://ats.me/apply/${job.id}`);
    
    return `  <job>
    <id>${escapeXML(job.id)}</id>
    <title>${escapeXML(job.title)}</title>
    <description><![CDATA[${job.description || ''}]]></description>
    <company>${company}</company>
    <location>${escapeXML(formatLocation(job.location, job.city, job.state))}</location>
    <url>${jobUrl}</url>
    <apply_url>${applyUrl}</apply_url>
    <date>${new Date(job.created_at).toISOString()}</date>
    ${job.salary_min ? `<salary_min>${job.salary_min}</salary_min>` : ''}
    ${job.salary_max ? `<salary_max>${job.salary_max}</salary_max>` : ''}
    ${job.salary_type ? `<salary_type>${escapeXML(job.salary_type)}</salary_type>` : ''}
    <salary_currency>USD</salary_currency>
    ${job.job_type ? `<contract_type>${escapeXML(mapJobType(job.job_type))}</contract_type>` : ''}
    ${job.category_name ? `<category>${escapeXML(job.category_name)}</category>` : ''}
  </job>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<jobs>
  <publisher>ATS.me</publisher>
  <generated>${new Date().toISOString()}</generated>
${jobsXML}
</jobs>`;
}

function generateDiceXML(jobs: JobListing[]): string {
  // Dice format is similar to Indeed but with tech-specific fields
  const jobsXML = jobs.map(job => {
    const company = escapeXML(job.company || job.client_name || 'Company');
    const jobUrl = escapeXML(`https://ats.me/jobs/${job.id}`);
    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);
    
    return `  <job>
    <dice_id>${escapeXML(job.id)}</dice_id>
    <title>${escapeXML(job.title)}</title>
    <company>${company}</company>
    <location>${escapeXML(formatLocation(job.location, job.city, job.state))}</location>
    <state>${escapeXML(job.state || '')}</state>
    <city>${escapeXML(job.city || '')}</city>
    <zip>${escapeXML(job.zip_code || '')}</zip>
    <country>${escapeXML(job.country || 'US')}</country>
    <apply_url>${jobUrl}</apply_url>
    <description><![CDATA[${job.description || ''}]]></description>
    ${job.requirements ? `<skills><![CDATA[${job.requirements}]]></skills>` : ''}
    <date_posted>${new Date(job.created_at).toISOString().split('T')[0]}</date_posted>
    ${salary ? `<salary>${escapeXML(salary)}</salary>` : ''}
    ${job.job_type ? `<employment_type>${escapeXML(mapJobType(job.job_type))}</employment_type>` : ''}
    ${job.remote_type === 'remote' ? '<telecommute>yes</telecommute>' : '<telecommute>no</telecommute>'}
  </job>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<dice_jobs>
  <publisher>ATS.me</publisher>
  <generated>${new Date().toISOString()}</generated>
${jobsXML}
</dice_jobs>`;
}

function generateJoobleXML(jobs: JobListing[]): string {
  const jobsXML = jobs.map(job => {
    const company = escapeXML(job.company || job.client_name || 'Company');
    const jobUrl = escapeXML(`https://ats.me/jobs/${job.id}`);
    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);
    
    return `  <job>
    <id>${escapeXML(job.id)}</id>
    <title>${escapeXML(job.title)}</title>
    <link>${jobUrl}</link>
    <company>${company}</company>
    <region>${escapeXML(job.state || '')}</region>
    <city>${escapeXML(job.city || '')}</city>
    <description><![CDATA[${job.description || ''}]]></description>
    <pubdate>${new Date(job.created_at).toISOString()}</pubdate>
    ${salary ? `<salary>${escapeXML(salary)}</salary>` : ''}
    ${job.job_type ? `<job_type>${escapeXML(mapJobType(job.job_type))}</job_type>` : ''}
    ${job.experience_level ? `<experience>${escapeXML(job.experience_level)}</experience>` : ''}
  </job>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<jobs>
  <source>ATS.me</source>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${jobsXML}
</jobs>`;
}

function generateGenericXML(jobs: JobListing[]): string {
  const jobsXML = jobs.map(job => {
    const company = escapeXML(job.company || job.client_name || 'Company');
    const location = formatLocation(job.location, job.city, job.state);
    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);
    const jobUrl = escapeXML(`https://ats.me/jobs/${job.id}`);
    const applyUrl = escapeXML(job.apply_url || `https://ats.me/apply/${job.id}`);
    
    return `  <job>
    <id>${escapeXML(job.id)}</id>
    <title>${escapeXML(job.title)}</title>
    <company>${company}</company>
    <location>${escapeXML(location)}</location>
    <city>${escapeXML(job.city || '')}</city>
    <state>${escapeXML(job.state || '')}</state>
    <zip>${escapeXML(job.zip_code || '')}</zip>
    <country>${escapeXML(job.country || 'US')}</country>
    <description><![CDATA[${job.description || ''}]]></description>
    ${salary ? `<salary>${escapeXML(salary)}</salary>` : ''}
    ${job.salary_min ? `<salary_min>${job.salary_min}</salary_min>` : ''}
    ${job.salary_max ? `<salary_max>${job.salary_max}</salary_max>` : ''}
    ${job.salary_type ? `<salary_type>${escapeXML(job.salary_type)}</salary_type>` : ''}
    ${job.job_type ? `<type>${escapeXML(job.job_type)}</type>` : ''}
    ${job.experience_level ? `<experience>${escapeXML(job.experience_level)}</experience>` : ''}
    ${job.category_name ? `<category>${escapeXML(job.category_name)}</category>` : ''}
    ${job.remote_type ? `<remote_type>${escapeXML(job.remote_type)}</remote_type>` : ''}
    <url>${jobUrl}</url>
    <apply_url>${applyUrl}</apply_url>
    <posted>${new Date(job.created_at).toISOString()}</posted>
    <updated>${new Date(job.updated_at || job.created_at).toISOString()}</updated>
  </job>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<jobs>
  <publisher>ATS.me</publisher>
  <generated>${new Date().toISOString()}</generated>
  <count>${jobs.length}</count>
${jobsXML}
</jobs>`;
}

function generateErrorXML(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<error>
  <message>${escapeXML(message)}</message>
  <timestamp>${new Date().toISOString()}</timestamp>
</error>`;
}

// ============ UTILITY FUNCTIONS ============

function escapeXML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatLocation(location?: string, city?: string, state?: string): string {
  if (location) return location;
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return 'Remote';
}

function formatSalary(min?: number, max?: number, type?: string): string {
  if (!min && !max) return '';
  const typeStr = type || 'year';
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()} per ${typeStr}`;
  if (min) return `$${min.toLocaleString()}+ per ${typeStr}`;
  if (max) return `Up to $${max.toLocaleString()} per ${typeStr}`;
  return '';
}

function mapJobType(jobType: string): string {
  // Normalize job types for different platforms
  const mapping: Record<string, string> = {
    'full-time': 'fulltime',
    'full_time': 'fulltime',
    'fulltime': 'fulltime',
    'part-time': 'parttime',
    'part_time': 'parttime',
    'parttime': 'parttime',
    'contract': 'contract',
    'contractor': 'contract',
    'temporary': 'temporary',
    'temp': 'temporary',
    'internship': 'internship',
    'intern': 'internship',
    'per-diem': 'perdiem',
    'per_diem': 'perdiem',
  };
  
  return mapping[jobType.toLowerCase()] || jobType;
}
