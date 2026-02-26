

## Update Social Links Across the Codebase

### Changes Required

**1. `src/components/public/PublicFooter.tsx`** (lines ~78-103)
- Update LinkedIn href from `https://linkedin.com/company/ats-me` to `https://www.linkedin.com/company/108142287/`
- Update X href from `https://x.com/ats_me` to `https://x.com/applyai_jobs`
- Remove the Facebook social link entry entirely

**2. `src/pages/public/LandingPage.tsx`** (lines ~18-21)
- Update Organization schema `sameAs` array:
  - LinkedIn: `https://www.linkedin.com/company/108142287/`
  - X: `https://x.com/applyai_jobs`
  - Remove any Facebook entry (none currently, but confirm)

**3. `src/components/SEO.tsx`** (lines ~35-36)
- Update `twitterSite` default from `@atsme` to `@applyai_jobs`
- Update `twitterCreator` default from `@atsme` to `@applyai_jobs`

**4. `src/components/blog/BlogShareButtons.tsx`** (lines ~50-58)
- Remove the Facebook share button from the `shareLinks` array

**5. `src/components/Footer.tsx`** (line ~17)
- Update copyright text from "ATS.me" to "Apply AI"

### No Changes Needed
- `JobDetailsPage.tsx` share functions (LinkedIn/X sharing uses dynamic URLs, not profile links)
- Social Beacon platform configs (these are product features for managing client social accounts, not our own links)
- `PlatformSetupDialog.tsx` / `PlatformCredentialsOverview.tsx` (API endpoint URLs, not social profile links)

