/**
 * Dynamic Sitemap Generator Edge Function
 * Generates sitemap.xml from static routes and database content
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const STATIC_ROUTES = [
  { loc: 'https://ats.me/', changefreq: 'daily', priority: 1.0 },
  { loc: 'https://ats.me/jobs', changefreq: 'daily', priority: 0.9 },
  { loc: 'https://ats.me/apply', changefreq: 'weekly', priority: 0.7 },
  { loc: 'https://ats.me/features', changefreq: 'weekly', priority: 0.9 },
  { loc: 'https://ats.me/pricing', changefreq: 'monthly', priority: 0.9 },
  { loc: 'https://ats.me/resources', changefreq: 'weekly', priority: 0.7 },
  { loc: 'https://ats.me/contact', changefreq: 'monthly', priority: 0.8 },
  { loc: 'https://ats.me/auth', changefreq: 'monthly', priority: 0.6 },
  { loc: 'https://ats.me/privacy-policy', changefreq: 'yearly', priority: 0.3 },
  { loc: 'https://ats.me/terms-of-service', changefreq: 'yearly', priority: 0.3 },
  { loc: 'https://ats.me/cookie-policy', changefreq: 'yearly', priority: 0.3 },
  { loc: 'https://ats.me/sitemap', changefreq: 'monthly', priority: 0.5 },
];

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function generateSitemapXML(urls: Array<{ loc: string; lastmod?: string; changefreq?: string; priority?: number }>): string {
  const today = new Date().toISOString().split('T')[0];
  
  const urlElements = urls
    .map(
      (url) => `
  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod || today}</lastmod>
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority !== undefined ? `<priority>${url.priority}</priority>` : ''}
  </url>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Start with static routes
    const allUrls = [...STATIC_ROUTES];

    // Get acme organization to exclude
    const { data: acmeOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'acme')
      .maybeSingle();

    // Fetch active job listings for dynamic URLs
    let jobsQuery = supabase
      .from('job_listings')
      .select('id, updated_at')
      .eq('status', 'active');

    if (acmeOrg?.id) {
      jobsQuery = jobsQuery.neq('organization_id', acmeOrg.id);
    }

    const { data: jobs, error: jobsError } = await jobsQuery;

    if (jobsError) {
      console.error('Error fetching jobs for sitemap:', jobsError);
    } else if (jobs) {
      jobs.forEach(job => {
        allUrls.push({
          loc: `https://ats.me/jobs/${job.id}`,
          lastmod: job.updated_at?.split('T')[0],
          changefreq: 'weekly',
          priority: 0.8,
        });
      });
    }

    // Fetch published blog posts
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('published', true);

    if (blogError) {
      console.error('Error fetching blog posts for sitemap:', blogError);
    } else if (blogPosts) {
      blogPosts.forEach(post => {
        allUrls.push({
          loc: `https://ats.me/blog/${post.slug}`,
          lastmod: post.updated_at?.split('T')[0],
          changefreq: 'weekly',
          priority: 0.7,
        });
      });
    }

    console.log(`Sitemap generated with ${allUrls.length} URLs (${jobs?.length || 0} jobs, ${blogPosts?.length || 0} blog posts)`);

    const sitemapXML = generateSitemapXML(allUrls);

    return new Response(sitemapXML, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=7200',
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
