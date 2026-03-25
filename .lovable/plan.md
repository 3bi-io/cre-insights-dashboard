
## Plan: Remove the last ATS.me branding from the Lovable preview login experience

### What I found
The actual `/auth` page in the app already renders as Apply AI:
- page title: `Sign In | Access Your Dashboard - Apply AI`
- visible logo/brand: `Apply AI`
- canonical/site config already point to `https://applyai.jobs`

So if you still see `ats.me` in Lovable preview, it is likely coming from a remaining metadata/cached branding surface rather than the visible auth page component itself.

### Likely causes
1. **Old browser/app metadata being cached in preview**
   - favicon / touch icon / page metadata can linger in preview tabs
2. **A leftover hardcoded brand string outside the main auth page**
   - older auth page, route wrapper, or shared metadata surface
3. **Preview shell behavior**
   - Lovable preview can preserve older tab/session branding even after app UI is updated

### Implementation plan

**1. Audit all brand surfaces tied to login/auth**
- Check auth routes, shared layout wrappers, favicon/icon references, SEO defaults, and any alternate auth page still in the repo
- Verify there is only one active auth experience and no stale fallback page still referencing old branding

**2. Normalize all app metadata to Apply AI**
- Ensure `index.html` title/meta remain Apply AI-only
- Verify favicon/apple-touch/icon assets and related tags are aligned with Apply AI branding
- Remove or replace any legacy ATS.me text in client-facing metadata/config files

**3. Eliminate stale auth page confusion**
- Confirm which auth page is actually routed (`src/pages/Auth.tsx` vs `src/features/auth/pages/AuthPage.tsx`)
- If both exist, keep the active one consistent and either retire or fully rebrand the unused legacy variant so preview never surfaces mixed branding

**4. Check preview-specific branding touchpoints**
- Review any preview-only or embedded auth/login flows that may still inherit old site labels
- If the remaining label is outside the app itself, I’ll isolate it and avoid changing working auth logic unnecessarily

**5. Verification**
- Re-test the preview auth route after changes
- Confirm these surfaces all say Apply AI:
  - auth page title
  - visible logo/header
  - favicon-linked brand surfaces
  - any auth/login card text
  - published site auth page

### Technical notes
- Current app code already shows Apply AI on `/auth`, so this is probably a **metadata/duplicate-page/cache cleanup** task, not a full auth rebuild.
- I will focus on:
  - `src/pages/Auth.tsx`
  - `src/features/auth/pages/AuthPage.tsx`
  - `src/components/common/Brand.tsx`
  - `src/config/siteConfig.ts`
  - `index.html`
- I will not change Supabase auth logic unless I find branding hardcoded inside an auth callback flow.

### Expected outcome
After cleanup, the login experience should consistently show **Apply AI** in preview and published contexts, with no user-facing ATS.me branding left in the auth flow.
