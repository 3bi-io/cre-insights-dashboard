import { createLogger } from "../_shared/logger.ts";
import { getServiceClient } from '../_shared/supabase-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base URL for job pages - configurable via environment variable
const BASE_URL = Deno.env.get('SITE_BASE_URL') || 'https://applyai.jobs';

const logger = createLogger('google-jobs-xml');

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const requestIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  try {
    const supabase = getServiceClient();

    // Get user_id from query params
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');
    const organizationId = url.searchParams.get('organization_id');
    
    if (!userId && !organizationId) {
      return new Response('Missing user_id or organization_id parameter', { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
      });
    }

    logger.info('Generating Google Jobs XML sitemap', { userId, organizationId });

    // Build query based on parameters
    let query = supabase
      .from('job_listings')
      .select(`
        id,
        updated_at,
        created_at,
        status
      `)
      .eq('status', 'active')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    } else if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: jobListings, error } = await query;

    if (error) {
      logger.error('Error fetching job listings', error);
      return new Response('Error fetching job listings', { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
      });
    }

    logger.info('Found active job listings', { count: jobListings?.length || 0 });

    // Generate XML sitemap
    const xmlContent = generateGoogleJobsSitemap(jobListings || []);

    const responseTime = Date.now() - startTime;

    // Get organization_id for logging
    let orgId = organizationId;
    if (!orgId && userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userId)
        .single();
      orgId = profile?.organization_id;
    }

    // Log feed access (non-blocking)
    supabase.from('feed_access_logs').insert({
      organization_id: orgId,
      user_id: userId,
      feed_type: 'google-jobs-sitemap',
      platform: 'google',
      request_ip: requestIp,
      user_agent: userAgent,
      job_count: jobListings?.length || 0,
      response_time_ms: responseTime
    }).catch(err => logger.error('Failed to log feed access', err));

    return new Response(xmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    logger.error('Error in google-jobs-xml function', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
    });
  }
});

/**
 * Generates a Google-compliant XML Sitemap for job listings
 * Each URL points to a job detail page that contains JobPosting JSON-LD
 */
function generateGoogleJobsSitemap(jobListings: Array<{ id: string; updated_at: string; created_at: string }>): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
<!-- Google Jobs Sitemap - Generated: ${new Date().toISOString()} -->
<!-- Total Jobs: ${jobListings.length} -->
<!-- Each URL contains JobPosting JSON-LD structured data -->
`;

  jobListings.forEach(job => {
    const jobUrl = `${BASE_URL}/jobs/${job.id}`;
    const lastMod = new Date(job.updated_at || job.created_at).toISOString().split('T')[0];

    xml += `  <url>
    <loc>${escapeXML(jobUrl)}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  });

  xml += `</urlset>`;

  return xml;
}

function escapeXML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
