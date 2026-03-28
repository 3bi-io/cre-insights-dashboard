

# Full SEO Audit Report - applyai.jobs

## Critical Issues

### 1. /jobs pages marked as noindex (SEVERITY: CRITICAL)
`src/utils/seoUtils.ts` line 150 includes `/jobs` in the `noIndexPatterns` array. This means:
- `/jobs` (public job listings) gets a `noindex` meta tag
- `/jobs/some-job-id` (every job detail page) also gets `noindex`
- The `useSEO` hook dynamically injects `<meta name="robots" content="noindex, nofollow">` for these pages

**This directly contradicts** `robots.txt` which explicitly `Allow: /jobs` and `Allow: /jobs/*`. Google sees the noindex meta tag and will de-index all job pages.

**Fix**: Remove `/jobs` from the `noIndexPatterns` array. It should only contain private/dashboard paths.

### 2. Duplicate/conflicting Organization schema
- `index.html` (lines 60-107): Contains Organization+LocalBusiness schema with `twitter.com/applyai` and `linkedin.com/company/applyai`
- `LandingPage.tsx` (lines 12-28): Contains separate Organization schema with `x.com/applyai_jobs` and `linkedin.com/company/108142287/`

Google will see both on the homepage, causing validation conflicts. The social links also differ between the two.

**Fix**: Remove the Organization schema from `index.html` (already injected dynamically by LandingPage). Keep only the WebSite schema in `index.html`.

### 3. OG image mismatch between static HTML and React Helmet
- `index.html` line 44: Uses Google Storage URL `https://storage.googleapis.com/gpt-engineer-file-uploads/...`
- `SEO.tsx` component: Uses `https://applyai.jobs/og-image.png` (via `ogImageUtils`)

Social crawlers (LinkedIn, Twitter, Facebook) typically only read the initial HTML since they don't execute JavaScript. The React Helmet tags may never override the static HTML for these crawlers. This means the static `index.html` OG tags are what social platforms actually see for **all** pages.

**Fix**: Update `index.html` OG image to `https://applyai.jobs/og-image.png` for consistency, OR keep the Google Storage URL if that's the intended branded image — but ensure the file actually exists at that URL.

## Medium Issues

### 4. SearchAction points to non-existent `/search` route
`index.html` line 120 defines a `SearchAction` with `urlTemplate: "https://applyai.jobs/search?q={search_term_string}"`. There is no `/search` route in the app. This will cause a Google Rich Results validation error.

**Fix**: Either remove the SearchAction schema or update it to point to `/jobs?search={search_term_string}` if the jobs page supports query-based search.

### 5. Social profile links inconsistency
| Source | Twitter | LinkedIn |
|--------|---------|----------|
| `index.html` schema | twitter.com/applyai | linkedin.com/company/applyai |
| `LandingPage.tsx` schema | x.com/applyai_jobs | linkedin.com/company/108142287/ |
| `SEO.tsx` twitter:creator | @applyai_jobs | — |

**Fix**: Standardize all social links to the correct handles across all files.

### 6. Missing `og:title` and `og:description` in static `<head>` section
Lines 40-48 of `index.html` define `og:type`, `og:url`, `og:image` but no `og:title` or `og:description`. These are added at lines 160-163 (outside `<head>`? or at bottom of head). This ordering is fine for rendering but should be verified — some crawlers stop reading after a certain point.

**Fix**: Move `og:title` and `og:description` to be adjacent to the other OG tags (lines 40-48).

## Minor Issues

### 7. Static sitemap.xml has stale `lastmod` dates
All entries show `2026-02-20` — over a month old. This doesn't affect indexing directly but reduces crawl priority signals.

**Fix**: Update dates or rely on the dynamic sitemap edge function.

### 8. `index.html` has conflicting `og:type` for sub-pages
The static `og:type` is `website` in `index.html`. For blog posts, `SEO.tsx` tries to set `og:type` to `article` via React Helmet, but social crawlers reading only the static HTML will always see `website`.

**Fix**: This is inherent to client-side rendering. Consider server-side rendering or pre-rendering for blog/job pages if social sharing accuracy is important.

## Summary of Required Changes

| File | Change | Priority |
|------|--------|----------|
| `src/utils/seoUtils.ts` | Remove `/jobs` from `noIndexPatterns` | CRITICAL |
| `index.html` | Remove duplicate Organization schema (keep WebSite only) | High |
| `index.html` | Move og:title/og:description to proper position in head | High |
| `index.html` | Fix or remove SearchAction (no /search route exists) | Medium |
| `index.html` | Standardize social profile URLs to match LandingPage.tsx | Medium |
| `index.html` | Update OG image URL to match SEO component | Medium |
| `public/sitemap.xml` | Update lastmod dates | Low |

