/**
 * Dynamic Sitemap Generator Utility
 * Generates sitemap.xml from routes and database content
 */

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export const STATIC_ROUTES: SitemapUrl[] = [
  {
    loc: 'https://ats.me/',
    changefreq: 'daily',
    priority: 1.0,
  },
  {
    loc: 'https://ats.me/jobs',
    changefreq: 'daily',
    priority: 0.9,
  },
  {
    loc: 'https://ats.me/features',
    changefreq: 'weekly',
    priority: 0.9,
  },
  {
    loc: 'https://ats.me/pricing',
    changefreq: 'monthly',
    priority: 0.9,
  },
  {
    loc: 'https://ats.me/demo',
    changefreq: 'weekly',
    priority: 0.9,
  },
  {
    loc: 'https://ats.me/resources',
    changefreq: 'weekly',
    priority: 0.7,
  },
  {
    loc: 'https://ats.me/contact',
    changefreq: 'monthly',
    priority: 0.8,
  },
  {
    loc: 'https://ats.me/auth',
    changefreq: 'monthly',
    priority: 0.6,
  },
  {
    loc: 'https://ats.me/privacy-policy',
    changefreq: 'yearly',
    priority: 0.3,
  },
  {
    loc: 'https://ats.me/terms-of-service',
    changefreq: 'yearly',
    priority: 0.3,
  },
  {
    loc: 'https://ats.me/cookie-policy',
    changefreq: 'yearly',
    priority: 0.3,
  },
  {
    loc: 'https://ats.me/sitemap',
    changefreq: 'monthly',
    priority: 0.5,
  },
];

/**
 * Generate sitemap XML from URLs
 */
export function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlsWithDate = urls.map(url => ({
    ...url,
    lastmod: url.lastmod || new Date().toISOString().split('T')[0],
  }));

  const urlElements = urlsWithDate
    .map(
      (url) => `
  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
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

/**
 * Escape XML special characters
 */
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

/**
 * Generate static sitemap (for fallback)
 */
export function generateStaticSitemap(): string {
  return generateSitemapXML(STATIC_ROUTES);
}
