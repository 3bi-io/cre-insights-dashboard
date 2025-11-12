/**
 * Dynamic Sitemap Generator Edge Function
 * Generates sitemap.xml from static routes and database content
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STATIC_ROUTES = [
  { loc: 'https://ats.me/', changefreq: 'daily', priority: 1.0 },
  { loc: 'https://ats.me/pricing', changefreq: 'weekly', priority: 0.9 },
  { loc: 'https://ats.me/demo', changefreq: 'weekly', priority: 0.9 },
  { loc: 'https://ats.me/features', changefreq: 'weekly', priority: 0.9 },
  { loc: 'https://ats.me/resources', changefreq: 'weekly', priority: 0.7 },
  { loc: 'https://ats.me/contact', changefreq: 'monthly', priority: 0.8 },
  { loc: 'https://ats.me/blog', changefreq: 'daily', priority: 0.8 },
  { loc: 'https://ats.me/auth', changefreq: 'monthly', priority: 0.6 },
  { loc: 'https://ats.me/privacy-policy', changefreq: 'yearly', priority: 0.3 },
  { loc: 'https://ats.me/terms-of-service', changefreq: 'yearly', priority: 0.3 },
  { loc: 'https://ats.me/cookie-policy', changefreq: 'yearly', priority: 0.3 },
  { loc: 'https://ats.me/sitemap', changefreq: 'monthly', priority: 0.8 },
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
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Start with static routes
    const allUrls = [...STATIC_ROUTES];

    // Add dynamic blog posts
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('published', true);

    blogPosts?.forEach(post => {
      allUrls.push({
        loc: `https://ats.me/blog/${post.slug}`,
        lastmod: post.updated_at,
        changefreq: 'weekly',
        priority: 0.7,
      });
    });

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
