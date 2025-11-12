/**
 * E2E SEO Tests
 */

import { test, expect } from '@playwright/test';

test.describe('SEO Implementation', () => {
  const pages = [
    { url: '/', titleContains: 'ATS.me', hasH1: true },
    { url: '/features', titleContains: 'Features', hasH1: true },
    { url: '/pricing', titleContains: 'Pricing', hasH1: true },
    { url: '/demo', titleContains: 'Demo', hasH1: true },
    { url: '/blog', titleContains: 'Blog', hasH1: true },
  ];

  for (const pageInfo of pages) {
    test(`${pageInfo.url} should have proper SEO`, async ({ page }) => {
      await page.goto(pageInfo.url);
      
      // Title tag
      const title = await page.title();
      expect(title).toContain(pageInfo.titleContains);
      expect(title.length).toBeLessThan(60);
      
      // Meta description
      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
      expect(metaDescription).toBeTruthy();
      expect(metaDescription!.length).toBeLessThan(160);
      
      // Canonical URL
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toContain('ats.me');
      
      // H1 tag
      if (pageInfo.hasH1) {
        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBe(1);
      }
      
      // Open Graph tags
      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
      const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
      
      expect(ogTitle).toBeTruthy();
      expect(ogDescription).toBeTruthy();
      expect(ogImage).toBeTruthy();
      
      // Twitter Card tags
      const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
      expect(twitterCard).toBeTruthy();
    });
  }

  test('should have valid structured data', async ({ page }) => {
    await page.goto('/');
    
    const structuredData = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(structuredData.length).toBeGreaterThan(0);
    
    // Validate JSON-LD
    structuredData.forEach(data => {
      const json = JSON.parse(data);
      expect(json['@context']).toBe('https://schema.org');
      expect(json['@type']).toBeTruthy();
    });
  });

  test('sitemap.xml should be accessible', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);
    
    const content = await page.content();
    expect(content).toContain('<?xml');
    expect(content).toContain('urlset');
    expect(content).toContain('https://ats.me');
  });

  test('robots.txt should be accessible', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    expect(response?.status()).toBe(200);
    
    const content = await page.content();
    expect(content).toContain('User-agent:');
    expect(content).toContain('Sitemap:');
  });
});
