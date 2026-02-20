
# Fix Domain: `apply.jobs` → `applyai.jobs`

## Problem
The previous rebrand incorrectly used `apply.jobs` as the domain, but the actual domain is `applyai.jobs`. All 462 references across 31 frontend files and 5 edge function files need updating.

## Change
Global find-and-replace of `apply.jobs` with `applyai.jobs` across every file that was touched in the rebrand. This is a straightforward string replacement -- no logic changes.

## Files to Update

### Frontend (26 files)
- `index.html` -- canonical, OG tags, structured data schemas
- `public/sitemap.xml` -- all `<loc>` entries
- `public/robots.txt` -- comments
- `public/widget.js` -- default base URL
- `src/utils/ogImageUtils.ts` -- BASE_URL
- `src/utils/blogImageUtils.ts` -- BASE_URL
- `src/utils/seoUtils.ts` -- keywords
- `src/utils/sitemapGenerator.ts` -- all static route URLs
- `src/utils/exportJobUrls.ts` -- BASE_URL (if updated)
- `src/components/StructuredData.tsx` -- BASE_URL
- `src/hooks/useSEO.ts` -- canonical base
- `src/hooks/useEmbedTokens.ts` -- widget script URL
- `src/components/Breadcrumbs.tsx` -- schema URL base
- `src/components/apply/EmbedThankYou.tsx` -- powered-by link
- `src/data/keywords.ts` -- SEO keywords
- `src/pages/public/LandingPage.tsx`
- `src/pages/public/FeaturesPage.tsx`
- `src/pages/public/JobsPage.tsx`
- `src/pages/public/JobDetailsPage.tsx`
- `src/pages/public/JobMapPage.tsx`
- `src/pages/public/BlogPage.tsx`
- `src/pages/public/SitemapPage.tsx`
- `src/pages/public/PrivacyPolicyPage.tsx`
- `src/pages/public/TermsOfServicePage.tsx`
- `src/pages/public/CookiePolicyPage.tsx`
- `src/pages/public/AudioShowcasePage.tsx`
- `src/pages/public/FoundersPassPage.tsx`
- `src/pages/public/SharedVoicePage.tsx`
- `src/components/public/PublicFooter.tsx`

### Edge Functions (5 files)
- `supabase/functions/_shared/email-config.ts`
- `supabase/functions/generate-sitemap/index.ts`
- `supabase/functions/indeed-xml-feed/index.ts`
- `supabase/functions/google-indexing-trigger/index.ts`
- `supabase/functions/x-engagement-webhook/index.ts`

### Post-edit
- Redeploy all 5 affected edge functions

## Technical Details

Every instance of the string `apply.jobs` becomes `applyai.jobs`. No other logic or structural changes are needed -- this is purely a domain correction.
