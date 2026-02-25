

## Remove Founders Pass Offering

This plan removes all Founders Pass references across the application, including the dedicated page, popup, header banner, CTA content, route definitions, admin creative generator, and related content/assets.

### Files to Delete
1. **src/pages/public/FoundersPassPage.tsx** -- Dedicated Founders Pass landing page
2. **src/features/landing/content/foundersPass.content.ts** -- Founders Pass content data
3. **src/features/landing/components/FoundersPassPopup.tsx** -- Auto-show popup dialog
4. **src/features/landing/components/FoundersPassVoiceCTA.tsx** -- Voice CTA component
5. **src/pages/admin/GenerateFoundersPassCreative.tsx** -- Admin creative generator page
6. **src/components/landing/CTASection.tsx** -- Old CTA section (references Founders Pass)

### Files to Modify

1. **src/components/routing/AppRoutes.tsx**
   - Remove `FoundersPassPage` lazy import and its route (`/founders-pass`)
   - Remove `GenerateFoundersPassCreative` lazy import and its admin route

2. **src/components/common/Header.tsx**
   - Remove or replace the Founders Pass announcement bar (the banner that says "Founders Pass -- $1/apply, zero upfront cost -- Claim yours now")

3. **src/features/landing/content/cta.content.ts**
   - Update badge, title, description, and CTA buttons to be generic (e.g., "Get Started" linking to `/register`, "Talk to Us" linking to `/contact`)
   - Remove Founders Pass pricing references ($0, $1-$3)

4. **src/features/landing/components/sections/CTASection.tsx**
   - Remove fallback `/founders-pass` paths from the CTABlock component props (will use whatever cta.content.ts provides)

5. **src/pages/Media.tsx**
   - Remove the `foundersPassCreatives` state, the fetch query filtering by `founders_pass`, and the entire "Founders Pass -- AI-Generated Creatives" card section

6. **src/utils/sitemapGenerator.ts**
   - Remove the `/founders-pass` entry from the sitemap URLs

### Summary of Impact
- The `/founders-pass` route will no longer exist
- The header announcement bar promoting Founders Pass will be removed
- CTA sections throughout the landing page will use generic messaging instead of Founders Pass branding
- The admin creative generator for Founders Pass will be removed
- The Media page will no longer show Founders Pass creatives
- The edge function (`supabase/functions/generate-founders-pass-creative`) can be cleaned up separately if desired

