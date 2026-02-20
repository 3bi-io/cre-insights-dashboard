
# SEO Plan Review: Advisory for Apply AI

## Executive Summary

Your submitted 2026 SEO plan is well-structured and covers all the right categories. Here is an honest assessment of where you stand today against each phase — what is already done, what is partially done, and what is genuinely missing. Several items in the plan are already implemented at a level that would impress most SEO consultants. However, there are specific, concrete gaps that will have real ranking impact if left unaddressed.

---

## Phase 1: Preparation — Status: PARTIALLY DONE

### What's already done
- Keywords are defined and centralized in `src/data/keywords.ts` with primary, secondary, and long-tail categorizations per page.
- GA4 is integrated via `react-ga4` with tracking for page views, events, user timing, zero-result searches, and conversions — all wired up in `src/utils/analytics.ts`.
- Google Analytics initialization is in `main.tsx`.

### What's missing
- **GA4 Measurement ID not verified active**: `VITE_GA_MEASUREMENT_ID` environment variable exists in code but has not been confirmed set in the Supabase/project secrets. If it is missing, GA4 is silently doing nothing in production.
- **Google Search Console not verified**: There is no meta verification tag or DNS TXT record visible in `index.html`. This is step one of any real SEO audit — without GSC connected, you have no impression/click data, no crawl error reports, and no performance feedback loop.
- **No Search Console sitemap submission confirmation**: Three sitemaps are declared in `robots.txt` (dynamic, Google Jobs XML, Indeed XML) and one static fallback in `public/sitemap.xml`. These need to be manually submitted in GSC.
- **Competitor gap analysis**: Not implemented in the codebase (this is a process/tooling item, not a code item).

### Action required
1. Confirm `VITE_GA_MEASUREMENT_ID` is set in project environment variables (check Secrets).
2. Add a `<meta name="google-site-verification" content="YOUR_CODE" />` tag to `index.html`.
3. Submit all four sitemaps to Google Search Console manually.

---

## Phase 2: Technical SEO — Status: STRONG, WITH GAPS

### What's already done (impressive depth)
- **Core Web Vitals monitoring**: Fully implemented. `src/utils/webVitals.ts` tracks LCP, FID, CLS, FCP, and TTFB using the `web-vitals` library and reports all metrics to GA4. This runs at app startup via `main.tsx`.
- **Structured data (JSON-LD)**: Comprehensive. `src/components/StructuredData.tsx` exports builders for: `BreadcrumbList`, `FAQPage`, `WebSite` (with SearchAction), `JobPosting` (Google Jobs compliant, full schema), `Article`, and `HowTo`.
- **`index.html` schemas**: Four schemas are embedded directly in the HTML: `Organization` (with business address, contact points, founding date), `WebSite` (with SearchAction), `SoftwareApplication` (with aggregate rating), and `WebPage` with `Speakable` (cssSelector targeting h1, .hero-description, .feature-title, main h2).
- **hreflang**: `en-US` and `x-default` tags are present in `index.html`. ✓
- **HTTPS**: Enforced via Supabase/Lovable hosting. ✓
- **Canonical URLs**: SEO component generates per-page canonical links via react-helmet-async. ✓
- **Breadcrumbs**: Auto-generated from URL path with JSON-LD BreadcrumbList schema output. ✓
- **robots.txt**: Detailed — covers Googlebot, Bingbot, social crawlers, AI-specific bots (GPTBot, ChatGPT-User, Claude-Web, Anthropic-AI, PerplexityBot, Cohere-ai, Google-Extended), and blocks aggressive scrapers (Ahrefs, Semrush, MJ12bot). ✓
- **Dynamic sitemaps**: Three live edge functions (`generate-sitemap`, `google-jobs-xml`, `indeed-xml-feed`) plus a static fallback `public/sitemap.xml`. ✓
- **Mobile responsiveness**: Tailwind CSS responsive design with viewport meta tag and viewport-fit=cover. ✓
- **Code splitting**: Vite config has manual chunks for vendor, UI, data, charts, forms, AI features. Heavy pages are lazy-loaded via `src/components/optimized/LazyComponents.tsx`. ✓
- **Performance preconnects**: `index.html` preconnects to Supabase, Google Fonts, ElevenLabs API, and CDN. ✓
- **Minification**: esbuild minification configured in vite.config.ts. ✓
- **Bundle visualizer**: rollup-plugin-visualizer is configured for production builds. ✓
- **Google Jobs indexing**: `google-indexing-trigger` edge function for real-time URL_UPDATED/URL_DELETED notifications. ✓
- **JobPosting validation**: Full validation utility in `src/utils/googleJobsValidation.ts`. ✓

### What's genuinely missing

**Critical — Missing LocalBusiness schema with geo-coordinates**
The `Organization` schema in `index.html` has the Anniston, AL address but is missing `geo` coordinates and is not typed as `LocalBusiness`. The plan specifically calls for this for local relevance:
```json
{
  "@type": ["Organization", "LocalBusiness"],
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 33.6598,
    "longitude": -85.8313
  }
}
```

**Minor — SoftwareApplication schema has fake aggregate rating**
The `aggregateRating` in `index.html` shows `ratingValue: 4.8` with `ratingCount: 50` — these are placeholder values. Google may penalize or ignore fake ratings. Either replace with real data from Supabase or remove this property entirely until real reviews exist.

**Minor — WebP images not enforced**
The plan calls for WebP image format. The codebase uses `.jpg`, `.png` assets. No WebP conversion or `<picture>` element fallbacks are present. This is a performance opportunity (typically 25-35% smaller files).

**Minor — No CDN for static assets**
Static assets are served from the Lovable/Vite build. No explicit CDN configuration (Cloudflare, etc.) is wired up beyond the hosting provider's default behavior.

---

## Phase 3: Content & On-Page Optimization — Status: STRONG FOUNDATION

### What's already done
- **Blog system**: Full blog with `blog_posts` table, `BlogPostPage`, `BlogPostCard`, `RelatedPosts`, `BlogShareButtons`, and `BlogFeaturedImage` components.
- **E-E-A-T**: Author bio (`author_bio`), author title (`author_title`), reading time estimation, timestamps, and Article JSON-LD schema are all implemented and displaying on blog posts. ✓
- **Reading time**: Calculated via `calculateReadingTime()` in `seoUtils.ts` and shown in blog listings and post pages. ✓
- **Article schema**: Per-post Article JSON-LD with `datePublished`, `dateModified`, `author`, `publisher`, and image. ✓
- **Share buttons**: `BlogShareButtons` component exists with social sharing. ✓
- **Related posts**: `RelatedPosts` component with category-based recommendations. ✓
- **FAQPage schema**: FAQ section on the landing page includes structured data. ✓
- **OG images per blog post**: Per-slug OG image mapping in `blogImageUtils.ts` for all six existing blog posts. ✓

### What's missing
- **Author avatar images**: The author card on `BlogPostPage.tsx` falls back to a generic `<User>` icon instead of a real photo. This weakens E-E-A-T visually. The `profiles` table has `avatar_url` — it's just not being used in the author card display.
- **Table of contents**: The plan mentions this for long-form content. No auto-generated TOC exists for blog posts. This is a UX and AEO improvement for long articles.
- **Remaining ats.me brand references**: Found 219 matches of `ats.me`, `ats-me`, or `ATS.me` still in the codebase across 21 files — primarily in internal/admin pages, PDF generators, support pages, and some user-facing components (`TestimonialsSection.tsx`, `ChooseAccountType.tsx`, `Support.tsx`, `BrandAssets.tsx`). These aren't all crawled pages, but the user-facing ones should be cleaned up.
- **`internalLinks.ts` still says "ATS.me"**: The description for `/features` reads "Explore ATS.me features and capabilities" and `/auth` reads "Access your ATS.me account" — these are used in internal linking logic.

---

## Phase 4: Off-Page & Link Building — Status: NOT IN CODEBASE (Process Item)

This is a process/outreach item, not a code item. The platform is set up to support it:
- Social meta tags (Twitter, LinkedIn OG) are implemented. ✓
- The blog system creates linkable content assets. ✓
- **Google Business Profile**: Not a code item — needs to be claimed at business.google.com for the Anniston, AL address already in the schema.
- **Local citations**: Not a code item.

---

## Phase 5: AI-Specific Enhancements (GEO/AEO) — Status: AHEAD OF THE PLAN

This is the strongest area. The platform already implements all of the plan's AI-specific recommendations and goes beyond them:

- **Speakable schema**: Already in `index.html` targeting h1, .hero-description, .feature-title, main h2. ✓
- **HowTo schema**: Builder exists in `StructuredData.tsx`. ✓
- **FAQPage schema**: Implemented on landing page and contact page. ✓
- **AI bot rules in robots.txt**: GPTBot, ChatGPT-User, Claude-Web, Anthropic-AI, PerplexityBot, Cohere-ai, Google-Extended all have explicit rules. ✓
- **AI crawler sitemaps**: Three dynamic sitemaps declared in robots.txt. ✓
- **GEO content structure**: Blog posts use H2/H3 headings, bullet lists, and Q&A formats (in FAQ section) suitable for AI extraction. ✓
- **Zero-result search tracking**: `trackSearch()` in `analytics.ts` fires a `no_results` event when result count is 0 — this feeds content gap analysis. ✓
- **Semantic entity linking**: `internalLinks.ts` defines RELATED_CONTENT by keyword (Voice Apply, Tenstreet, ATS software, etc.) for contextual linking. ✓

### Minor gap
- **LSI/semantic keyword integration in meta**: The `keywords.ts` data is defined but not being auto-injected into the `<SEO>` component across all public pages. Each page component must manually pass the correct keywords string — there is no automated injection from the centralized keyword store.

---

## Phase 6: Monitoring & Iteration — Status: GOOD INFRASTRUCTURE, NEEDS ACTIVATION

### What's already done
- **GA4 with Web Vitals**: All five Core Web Vitals metrics reported to GA4 automatically. ✓
- **Sentry error tracking**: Integrated via `src/utils/sentry.ts` and initialized in `main.tsx`. ✓
- **Performance monitoring hook**: `usePerformanceMonitor` started in `main.tsx`. ✓
- **Slow render detection**: `useRenderTimeObserver` logs renders over 16ms. ✓
- **Bundle visualization**: `rollup-plugin-visualizer` generates `dist/stats.html` on production builds. ✓

### What's missing
- **Google Search Console connection**: Without GSC verified (see Phase 1), there is no impression/click data, no ranking visibility, and no crawl coverage reports.
- **No A/B testing**: No Google Optimize or equivalent is wired up. This is a future item, not urgent.

---

## Priority Summary: What to Actually Do

### Do These Now (High Impact, Low Effort)

| # | Action | Where |
|---|--------|--------|
| 1 | Add Google Search Console verification meta tag | `index.html` |
| 2 | Confirm `VITE_GA_MEASUREMENT_ID` secret is set | Project secrets |
| 3 | Add `LocalBusiness` type + `geo` coordinates to Organization schema | `index.html` |
| 4 | Remove or replace fake `aggregateRating` on SoftwareApplication schema | `index.html` |
| 5 | Fix `internalLinks.ts` — replace "ATS.me" with "Apply AI" in descriptions | `src/utils/internalLinks.ts` |
| 6 | Fix user-facing "ATS.me" references in `TestimonialsSection.tsx`, `ChooseAccountType.tsx`, `Support.tsx` | Multiple files |

### Do These Next (Medium Impact)

| # | Action | Where |
|---|--------|--------|
| 7 | Wire author `avatar_url` from profiles into the blog post author card | `BlogPostPage.tsx` |
| 8 | Add auto-generated table of contents for long blog posts | New component |
| 9 | Claim Google Business Profile for Anniston, AL address | External — business.google.com |
| 10 | Submit all four sitemaps in Google Search Console | External — GSC |
| 11 | Add automated keyword injection from `keywords.ts` into the `<SEO>` component per page | `SEO.tsx` + routing |

### Do Later (Lower Impact or Requires External Work)

| # | Action |
|---|--------|
| 12 | Convert hero/blog images to WebP format |
| 13 | Set up CDN (Cloudflare) in front of the hosting origin |
| 14 | Begin guest post / link building outreach campaign |
| 15 | A/B test title tags and meta descriptions via GSC performance data |
| 16 | Add GEO/AI citation tracking via Ahrefs Content Explorer or similar |

---

## One Observation Worth Highlighting

The platform is already doing more advanced GEO/AEO work than 95% of SaaS companies — Speakable schema, AI bot-specific robots.txt rules, zero-result search tracking, and structured data at the edge function level are all genuinely cutting-edge implementations. The gaps are mostly execution details (GSC verification, a couple of schema cleanups, remaining brand name residue) rather than fundamental architectural issues.

The single highest-leverage action is verifying Google Search Console so you can see actual search performance data and identify which pages and queries are gaining traction.
