

## Global SEO Audit & Optimization Plan

### Audit Summary

After reviewing all 18 public pages, here is the current state and what needs fixing:

---

### Issue 1: Domain Identity Crisis (CRITICAL)

The `SEO` component (`src/components/SEO.tsx`) uses `ats.me` as the domain, while every page's `canonical` prop and structured data hardcodes `applyai.jobs`. This creates conflicting signals:

- `SEO.tsx` line: `const url = canonical || 'https://ats.me${window.location.pathname}'`
- `SEO.tsx` line: `og:site_name` = `"ATS.me"`
- But all pages pass `canonical="https://applyai.jobs/..."`
- `breadcrumbSchema.ts` uses `applyai.jobs`
- `useSEO.ts` uses `applyai.jobs`

**Fix:** Centralize the site domain as a single constant (e.g., `SITE_URL = 'https://applyai.jobs'`) and update `SEO.tsx` to use it for `og:site_name`, default canonical, and all fallback URLs. Update `breadcrumbSchema.ts` and `useSEO.ts` to use the same constant.

---

### Issue 2: Pages with NO SEO Component (HIGH)

Two public pages have zero SEO coverage:

| Page | Route | Problem |
|------|-------|---------|
| `SharedVoicePage` | `/voice/:shareCode` | No SEO, no meta tags at all. Dynamic content -- needs dynamic title/description from conversation data |
| `AudioShowcasePage` | `/audio/:id` | Uses raw `Helmet` with hardcoded OG tags. No `<SEO>` component, no structured data |

**Fix:** Add `<SEO>` component to both. `SharedVoicePage` should use dynamic data from the conversation. `AudioShowcasePage` should use `<SEO>` instead of raw Helmet for consistency.

---

### Issue 3: Pages Missing Structured Data (HIGH)

| Page | Has SEO | Has StructuredData | Missing |
|------|---------|-------------------|---------|
| `ClientsPage` | Yes | **No** | `CollectionPage` + `ItemList` schema for employer listings |
| `BlogPage` | Yes | Yes (added) | Good |
| `JobMapPage` | Helmet only | **No** | `WebPage` schema, breadcrumbs |
| `AudioShowcasePage` | Helmet only | **No** | `AudioObject` schema |
| `SharedVoicePage` | **No** | **No** | `WebPage` schema |

**Fix:** Add appropriate structured data to each page.

---

### Issue 4: Missing Breadcrumb Schemas (MEDIUM)

Pages with no breadcrumb structured data:

- `ClientsPage` -- needs `Home > Employers` breadcrumb
- `BlogPage` -- needs `Home > Blog` breadcrumb
- `JobMapPage` -- needs `Home > Job Map` breadcrumb
- `LandingPage` -- needs `WebSite` breadcrumb (homepage)

**Fix:** Add `buildBreadcrumbSchema` calls to these pages.

---

### Issue 5: Missing Canonical URLs (MEDIUM)

Several pages omit the `canonical` prop, falling back to the wrong domain (`ats.me`):

- `ClientsPage` -- no canonical
- `LandingPage` -- has canonical but hardcoded
- `BlogPostPage` -- no canonical (dynamic posts)
- `JobDetailsPage` -- no canonical (dynamic jobs)

**Fix:** Add explicit canonical URLs to all pages. For dynamic pages, construct from the route params.

---

### Issue 6: JobMapPage Uses Raw Helmet Instead of SEO Component (MEDIUM)

`JobMapPage` manually writes all meta tags via `<Helmet>` instead of using the `<SEO>` component. This bypasses the centralized OG image system, twitter card defaults, and site name.

**Fix:** Replace the raw Helmet block with `<SEO>` component.

---

### Issue 7: Legal Pages Marked `noindex` (LOW - Intentional?)

All three legal pages (`PrivacyPolicyPage`, `TermsOfServicePage`, `CookiePolicyPage`) via `LegalPageLayout` set `noindex={true}`. This is unusual -- most SEO best practices recommend indexing legal pages as they signal trustworthiness (E-E-A-T) and are expected by Google's quality raters.

**Fix:** Remove `noindex` from legal pages to allow indexing.

---

### Issue 8: No Global `hreflang` Tags (LOW)

The project has `i18next` installed with language detection, but no `hreflang` tags are rendered. If multi-language content exists or is planned, this is a gap.

**Fix:** Add `hreflang` link tags in the SEO component when locale data is available.

---

### Implementation Plan

**Phase 1 -- Critical Fixes (Domain + Missing SEO)**
1. Create `src/config/siteConfig.ts` with `SITE_URL`, `SITE_NAME`, `DEFAULT_OG_IMAGE` constants
2. Update `src/components/SEO.tsx` to use `SITE_URL` for canonicals, `SITE_NAME` for og:site_name
3. Update `src/utils/breadcrumbSchema.ts` and `src/hooks/useSEO.ts` to use `SITE_URL`
4. Add `<SEO>` component to `SharedVoicePage` with dynamic conversation data
5. Replace raw Helmet in `AudioShowcasePage` with `<SEO>` component
6. Replace raw Helmet in `JobMapPage` with `<SEO>` component

**Phase 2 -- Structured Data + Breadcrumbs**
7. Add `CollectionPage` + `ItemList` schema to `ClientsPage`
8. Add breadcrumb schemas to `ClientsPage`, `BlogPage`, `JobMapPage`
9. Add `AudioObject` schema builder to `StructuredData.tsx` for `AudioShowcasePage`
10. Add explicit canonical URLs to `ClientsPage`, `BlogPostPage`, `JobDetailsPage`

**Phase 3 -- E-E-A-T Polish**
11. Remove `noindex` from legal pages in `LegalPageLayout.tsx`
12. Add `Organization` schema to the landing page alongside `WebSite` schema

### Technical Details

**New file:**
- `src/config/siteConfig.ts` -- single source of truth for domain, site name, default images

**Files to modify:**
- `src/components/SEO.tsx` -- use siteConfig constants
- `src/utils/breadcrumbSchema.ts` -- use `SITE_URL` constant
- `src/hooks/useSEO.ts` -- use `SITE_URL` constant
- `src/pages/public/JobMapPage.tsx` -- replace Helmet with SEO component + add breadcrumbs
- `src/pages/public/AudioShowcasePage.tsx` -- replace Helmet with SEO component + add AudioObject schema
- `src/pages/public/SharedVoicePage.tsx` -- add SEO component with dynamic data
- `src/pages/public/ClientsPage.tsx` -- add canonical, breadcrumbs, CollectionPage schema
- `src/pages/public/BlogPage.tsx` -- add breadcrumb schema
- `src/pages/public/BlogPostPage.tsx` -- add explicit canonical
- `src/pages/public/JobDetailsPage.tsx` -- add explicit canonical
- `src/pages/public/LandingPage.tsx` -- add Organization schema
- `src/components/public/LegalPageLayout.tsx` -- remove noindex
- `src/components/StructuredData.tsx` -- add `buildAudioObjectSchema`, `buildCollectionPageSchema`

