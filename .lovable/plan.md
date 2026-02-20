
# Rebrand: ATS.me to Apply AI (Aᴘᴘʟʏ Aɪ) + Domain Migration to apply.jobs

## Scope

This is a comprehensive rebrand touching **90+ files** across frontend, backend edge functions, email templates, SEO metadata, public assets, and embed/widget infrastructure. The new domain is `https://apply.jobs` replacing all `https://ats.me` references.

---

## 1. Core Brand Identity Changes

**Brand name**: `ATS.me` becomes `Apply AI` (display: `Aᴘᴘʟʏ Aɪ` for stylized, `Apply AI` for plain text)

Files to update:
- `src/components/common/Brand.tsx` -- Change default `organizationName` from `'ATS.me'` to `'Apply AI'`, update stylized text from `ATS` / `.ᴍᴇ` to `Aᴘᴘʟʏ` / ` Aɪ`
- `src/components/common/LogoIcon.tsx` -- Update alt text
- `src/i18n/locales/en.json` -- `app.name` and `app.tagline`
- `src/components/dashboard/DashboardLoading.tsx` -- Title and subtitle text
- `src/pages/Auth.tsx` -- "Next-Generation Applicant Tracking System" tagline
- `capacitor.config.ts` -- `appName` from `'ats-me'` to `'apply-ai'`

## 2. Domain Migration (ats.me to apply.jobs)

Every hardcoded `https://ats.me` URL changes to `https://apply.jobs`. This affects **34+ frontend files** and **26+ edge function files**.

Key areas:
- `index.html` -- Canonical URL, OG tags, Twitter cards, structured data (Organization, WebSite, SoftwareApplication, WebPage schemas), all `https://ats.me` references
- `public/sitemap.xml` -- All `<loc>` entries
- `public/robots.txt` -- Sitemap URL and comments
- `public/widget.js` -- Default `data-base-url` and comments
- `public/logo.svg` / `public/logo-icon.svg` -- SVG text content
- `src/utils/ogImageUtils.ts` -- `BASE_URL`
- `src/utils/blogImageUtils.ts` -- `BASE_URL`
- `src/utils/seoUtils.ts` -- Keywords
- `src/components/StructuredData.tsx` -- `BASE_URL` and schema name
- `src/hooks/useSEO.ts` -- Canonical URL base
- `src/hooks/useEmbedTokens.ts` -- Widget script `src` URL in generated embed code
- `src/components/Breadcrumbs.tsx` -- Schema URL base
- `src/components/apply/EmbedThankYou.tsx` -- "Powered by" link
- `src/data/keywords.ts` -- SEO keyword references

**Page-specific SEO** (canonical, OG, descriptions):
- `src/pages/public/LandingPage.tsx`
- `src/pages/public/FeaturesPage.tsx`
- `src/pages/public/JobsPage.tsx`
- `src/pages/public/BlogPage.tsx`
- `src/pages/public/SitemapPage.tsx`
- `src/pages/public/CookiePolicyPage.tsx`
- `src/pages/public/AudioShowcasePage.tsx`
- `src/pages/public/TermsOfServicePage.tsx`
- `src/pages/public/PrivacyPolicyPage.tsx`
- And other public pages with `canonical` props

## 3. Edge Functions (Backend)

All edge functions with hardcoded `ats.me` references:

- `supabase/functions/_shared/email-config.ts` -- Brand name, sender display names, logo URL, website URL, footer copyright, all `"ATS.me"` strings become `"Apply AI"`
- `supabase/functions/auth-email-templates/index.ts` -- Logo alt text in all 5 email templates
- `supabase/functions/generate-sitemap/index.ts` -- All static route URLs
- `supabase/functions/indeed-xml-feed/index.ts` -- Apply URLs and publisher name
- `supabase/functions/google-indexing-trigger/index.ts` -- Base URL
- `supabase/functions/x-engagement-webhook/index.ts` -- Apply URL template
- `supabase/functions/generate-logo/index.ts` -- All AI prompt text
- `supabase/functions/_shared/ats-adapters/xml-post-adapter.ts` -- Fallback source name and display field
- Database migration `20260205014929` -- Job URL in notification trigger

## 4. Email Sender Display Names

In `email-config.ts`, all sender display names change:
```
"ATS.me <noreply@...>"       -> "Apply AI <noreply@...>"
"ATS.me Admin <admin@...>"   -> "Apply AI Admin <admin@...>"
"ATS.me Support <support@...>" -> "Apply AI Support <support@...>"
```
(The actual email addresses at `notifications.3bi.io` remain unchanged)

## 5. Embed Widget and Apply URLs

- `public/widget.js` -- Default base URL changes to `https://apply.jobs`, comments updated
- `src/hooks/useEmbedTokens.ts` -- Generated embed code snippets use `https://apply.jobs/widget.js`
- Universal apply URLs change from `https://ats.me/apply?...` to `https://apply.jobs/apply?...`
- All `/apply`, `/embed/apply`, and social apply routes remain the same paths (only the domain changes)

## 6. SEO and Structured Data

- All JSON-LD schemas updated with new brand name and domain
- Twitter handle `@atsme` should be updated (advise: register `@applyai` or similar)
- Social media `sameAs` links need updating (LinkedIn, Twitter)
- OG image alt text updated
- Meta keywords updated to remove "ATS software" references and add "Apply AI" terms

## 7. SVG Logo Assets

- `public/logo.svg` -- Update text from "ATS" / ".me" to "Apply" / " AI"
- `public/logo-icon.svg` -- Icon itself can stay (abstract bars), no text to change

## 8. Content Updates

- `src/features/landing/content/hero.content.ts` -- No ATS.me references (clean)
- `src/features/landing/content/cta.content.ts` -- No ATS.me references (clean)
- `src/features/landing/content/benefits.content.ts` -- "Why Organizations Choose ATS.me" becomes "Why Organizations Choose Apply AI"
- `src/components/public/PublicFooter.tsx` -- Description text
- `src/features/admin/components/AdminEmailUtility.tsx` -- Fallback org name

---

## Important Advisory: Domain Setup

Before or alongside this rebrand, you will need to:

1. **Register/verify `apply.jobs`** as a custom domain in Lovable (Settings > Domains)
2. Add DNS records: A records for `@` and `www` pointing to `185.158.133.1`, plus the TXT verification record
3. Set `apply.jobs` as the **Primary** domain
4. Social media handles and email sender verification may need updating separately

## Implementation Order

1. Frontend brand identity (Brand component, i18n, loading screens)
2. index.html meta/SEO overhaul
3. Public static assets (sitemap.xml, robots.txt, widget.js, logo.svg)
4. All page-level SEO (canonical URLs, OG tags across ~15 pages)
5. Utility files (ogImageUtils, blogImageUtils, seoUtils, StructuredData)
6. Edge functions (email-config, sitemap generator, XML feeds, webhooks)
7. Deploy all edge functions

---

## Technical Notes

- The `email-config.ts` `logo` URL will need updating once a new logo asset is deployed; for now it will point to `https://apply.jobs/assets/logo-icon-BEFigvat.png` (the hashed filename may change on next build)
- The database migration SQL with `https://ats.me/jobs/` in the notification trigger should be updated via a new migration
- Universal apply URLs shared with partners (Danny Herman, Pemberton, etc.) will need to be re-communicated with the new `apply.jobs` domain
- Indeed XML feed and CDL Job Cast integrations reference `ats.me` in apply URLs -- these will update automatically once the edge functions are redeployed
