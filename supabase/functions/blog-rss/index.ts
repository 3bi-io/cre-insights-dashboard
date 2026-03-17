/**
 * Blog RSS/Atom Feed Edge Function
 * Generates an Atom feed from published blog posts for AI crawlability
 */

import { createClient } from 'npm:@supabase/supabase-js@2.50.0';
import { getCorsHeaders } from '../_shared/cors-config.ts';

const BASE_URL = 'https://applyai.jobs';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug, title, description, content, published_at, updated_at, category, tags')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const lastUpdated = posts?.[0]?.updated_at || new Date().toISOString();

    const entries = (posts || []).map((post) => {
      const summary = post.description || stripHtml(post.content).substring(0, 300);
      const published = post.published_at || post.updated_at;
      const categories = [
        ...(post.category ? [post.category] : []),
        ...(post.tags || []),
      ];

      return `  <entry>
    <title>${escapeXml(post.title)}</title>
    <link href="${BASE_URL}/blog/${escapeXml(post.slug)}" rel="alternate" />
    <id>${BASE_URL}/blog/${escapeXml(post.slug)}</id>
    <published>${published}</published>
    <updated>${post.updated_at}</updated>
    <summary type="text">${escapeXml(summary)}</summary>
${categories.map(c => `    <category term="${escapeXml(c)}" />`).join('\n')}
  </entry>`;
    }).join('\n');

    const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Apply AI Blog</title>
  <subtitle>Expert insights on AI-powered recruitment and HR technology</subtitle>
  <link href="${BASE_URL}/blog" rel="alternate" />
  <link href="${BASE_URL}/functions/v1/blog-rss" rel="self" type="application/atom+xml" />
  <id>${BASE_URL}/blog</id>
  <updated>${lastUpdated}</updated>
  <author>
    <name>Apply AI</name>
    <uri>${BASE_URL}</uri>
  </author>
  <icon>${BASE_URL}/favicon.ico</icon>
  <logo>${BASE_URL}/logo.png</logo>
${entries}
</feed>`;

    return new Response(feed, {
      headers: {
        ...getCorsHeaders(origin),
        'Content-Type': 'application/atom+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
});
