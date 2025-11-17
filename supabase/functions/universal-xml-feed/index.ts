import { getServiceClient } from '../_shared/supabase-client.ts'
import { getCorsHeaders } from '../_shared/cors-config.ts'
import { errorResponse } from '../_shared/response.ts'
import { wrapHandler, ValidationError } from '../_shared/error-handler.ts'
import { createLogger } from '../_shared/logger.ts'
import { isValidUuid } from '../_shared/validation-helpers.ts'

const logger = createLogger('universal-xml-feed');

interface JobListing {
  id: string;
  title: string;
  description: string;
  location?: string;
  city?: string;
  state?: string;
  salary_min?: number;
  salary_max?: number;
  salary_type?: string;
  job_type?: string;
  experience_level?: string;
  created_at: string;
  apply_url?: string;
  category_name?: string;
  client_name?: string;
  company?: string;
  client_email?: string;
  organization_id: string;
  client_id?: string;
}

const handler = wrapHandler(async (req) => {
  const origin = req.headers.get('origin');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  const startTime = Date.now();
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organization_id');
  const clientId = url.searchParams.get('client_id');
  const format = url.searchParams.get('format') || 'generic';

  logger.info('Universal XML Feed Request', { organizationId, clientId, format });

  // Validate required parameters
  if (!organizationId) {
    return new Response(
      generateErrorXML('Missing required parameter: organization_id'),
      {
        status: 400,
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/xml' }
      }
    );
  }

  // Validate UUID format
  if (!isValidUuid(organizationId)) {
    return new Response(
      generateErrorXML('Invalid organization_id format'),
      {
        status: 400,
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/xml' }
      }
    );
  }

  if (clientId && !isValidUuid(clientId)) {
    return new Response(
      generateErrorXML('Invalid client_id format'),
      {
        status: 400,
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/xml' }
      }
    );
  }

  // Validate format
  const validFormats = ['indeed', 'google', 'generic'];
  if (!validFormats.includes(format)) {
    return new Response(
      generateErrorXML(`Invalid format. Must be one of: ${validFormats.join(', ')}`),
      {
        status: 400,
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/xml' }
      }
    );
  }

    // Rate limiting using Deno KV
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = ['rate_limit', 'universal_feed', clientIP];
    const kv = await Deno.openKv();
    
    const rateLimitEntry = await kv.get(rateLimitKey);
    const currentCount = (rateLimitEntry.value as number) || 0;
    
    if (currentCount >= 1000) {
      await kv.close();
      logger.warn('Rate limit exceeded', { clientIP, currentCount });
      return new Response(
        generateErrorXML('Rate limit exceeded. Maximum 1000 requests per hour.'),
        {
          status: 429,
          headers: { 
            ...getCorsHeaders(origin), 
            'Content-Type': 'application/xml',
            'Retry-After': '3600'
          }
        }
      );
    }

    // Increment rate limit counter
    await kv.set(rateLimitKey, currentCount + 1, { expireIn: 3600000 }); // 1 hour
    await kv.close();

    // Initialize Supabase client with service role (bypasses RLS)
    const supabase = getServiceClient();

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
      logger.error('Database error', error);
      return new Response(
        generateErrorXML('Failed to fetch job listings'),
        {
          status: 500,
          headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/xml' }
        }
      );
    }

    // Transform data for XML generation
    const transformedJobs: JobListing[] = (jobs || []).map((job: any) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      location: job.location,
      city: job.city,
      state: job.state,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_type: job.salary_type,
      job_type: job.job_type,
      experience_level: job.experience_level,
      created_at: job.created_at,
      apply_url: job.apply_url,
      category_name: job.job_categories?.name,
      client_name: job.clients?.name,
      company: job.clients?.company,
      client_email: job.clients?.email,
      organization_id: job.organization_id,
      client_id: job.client_id,
    }));

    // Generate XML based on format
    let xmlContent: string;
    switch (format) {
      case 'indeed':
        xmlContent = generateIndeedXML(transformedJobs);
        break;
      case 'google':
        xmlContent = generateGoogleJobsXML(transformedJobs, organizationId);
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

    logger.info('Feed generated successfully', {
      format,
      jobCount: transformedJobs.length,
      responseTime
    });

    return new Response(xmlContent, {
      headers: {
        ...getCorsHeaders(origin),
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
}, { context: 'universal-xml-feed', logRequests: true });

Deno.serve(handler);

function generateIndeedXML(jobs: JobListing[]): string {
  const jobsXML = jobs.map(job => {
    const company = escapeXML(job.company || job.client_name || 'Company');
    const location = formatLocation(job.location, job.city, job.state);
    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);
    const applyUrl = escapeXML(job.apply_url || `https://example.com/apply/${job.id}`);
    
    return `    <job>
      <title>${escapeXML(job.title)}</title>
      <date>${new Date(job.created_at).toISOString().split('T')[0]}</date>
      <referencenumber>${escapeXML(job.id)}</referencenumber>
      <url>${applyUrl}</url>
      <company>${company}</company>
      <city>${escapeXML(job.city || 'Remote')}</city>
      <state>${escapeXML(job.state || '')}</state>
      <country>US</country>
      <postalcode></postalcode>
      <description><![CDATA[${job.description || ''}]]></description>
      ${salary ? `<salary>${escapeXML(salary)}</salary>` : ''}
      ${job.job_type ? `<jobtype>${escapeXML(job.job_type)}</jobtype>` : ''}
      ${job.category_name ? `<category>${escapeXML(job.category_name)}</category>` : ''}
      ${job.experience_level ? `<experience>${escapeXML(job.experience_level)}</experience>` : ''}
    </job>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<source>
  <publisher>Recruiter Platform</publisher>
  <publisherurl>https://example.com</publisherurl>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  ${jobsXML}
</source>`;
}

function generateGoogleJobsXML(jobs: JobListing[], organizationId: string): string {
  const jobsXML = jobs.map(job => {
    const applyUrl = escapeXML(job.apply_url || `https://example.com/apply/${job.id}`);
    
    return `  <url>
    <loc>${applyUrl}</loc>
    <lastmod>${new Date(job.created_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${jobsXML}
</urlset>`;
}

function generateGenericXML(jobs: JobListing[]): string {
  const jobsXML = jobs.map(job => {
    const company = escapeXML(job.company || job.client_name || 'Company');
    const location = formatLocation(job.location, job.city, job.state);
    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);
    const applyUrl = escapeXML(job.apply_url || `https://example.com/apply/${job.id}`);
    
    return `  <job>
    <id>${escapeXML(job.id)}</id>
    <title>${escapeXML(job.title)}</title>
    <company>${company}</company>
    <location>${escapeXML(location)}</location>
    <description><![CDATA[${job.description || ''}]]></description>
    ${salary ? `<salary>${escapeXML(salary)}</salary>` : ''}
    ${job.job_type ? `<type>${escapeXML(job.job_type)}</type>` : ''}
    ${job.experience_level ? `<experience>${escapeXML(job.experience_level)}</experience>` : ''}
    ${job.category_name ? `<category>${escapeXML(job.category_name)}</category>` : ''}
    <url>${applyUrl}</url>
    <posted>${new Date(job.created_at).toISOString()}</posted>
  </job>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<jobs>
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
