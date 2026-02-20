
# Fix: /embed/apply Fetch Failures + Complete Rebrand Cleanup

## Root Cause Analysis

The `/embed/apply` fetch fails because `getCorsHeaders()` in `supabase/functions/_shared/cors-config.ts` validates the request `origin` against a hardcoded allowlist that still only contains `https://ats.me` and `https://ats-me.lovable.app`. When an embedded form on an external site posts to `submit-application`, the origin is rejected and the browser blocks the response.

Additionally, the previous rebrand sweeps missed **27 frontend files and 6+ edge function files** still containing `ats.me` references, plus 3 database client logo URLs pointing to the old Lovable subdomain.

---

## Fix 1 — CORS Configuration (Critical — fixes the embed fetch failure)

**File:** `supabase/functions/_shared/cors-config.ts`

Two changes:
1. Replace `https://ats.me`, `https://www.ats.me`, and `https://ats-me.lovable.app` with `https://applyai.jobs` and `https://www.applyai.jobs` in `ALLOWED_ORIGINS`.
2. Change the fallback in `getCorsHeaders()` from returning `ALLOWED_ORIGINS[0]` (which would be the old first entry) to returning `'*'` for unrecognized origins — the embed form is a genuinely public endpoint called from arbitrary third-party domains.

Also update `inbound-applications/index.ts` which has a hardcoded origin check for `ats.me` and `ats-me.lovable.app`.

## Fix 2 — Edge Functions with Remaining ats.me References

| File | What to fix |
|---|---|
| `supabase/functions/sync-cdl-feeds/index.ts` | `generateApplyUrl` base URL: `https://ats.me/apply` → `https://applyai.jobs/apply` |
| `supabase/functions/import-jobs-from-feed/index.ts` | Same `generateApplyUrl` base URL |
| `supabase/functions/social-oauth-callback/index.ts` | Fallback `FRONTEND_URL`: `https://ats-me.lovable.app` → `https://applyai.jobs` (in 2 places) |
| `supabase/functions/universal-xml-feed/index.ts` | `buildApplyUrl` uses `https://ats.me/apply`; publisher name `ATS.me` → `Apply AI` across all ~10 XML generator functions (`generateIndeedXML`, `generateCareerJetXML`, `generateAdzunaXML`, `generateDiceXML`, `generateJoobleXML`, `generateGenericXML`, `generateHcareersXML`, `generateSnagajobXML`, `generateWellfoundXML`) |
| `supabase/functions/send-welcome-email/index.ts` | Brand name strings: "ATS.me" → "Apply AI", "The ATS.me Team" → "The Apply AI Team", subject line, logo alt text, quick start guide link text |
| `supabase/functions/send-invite-email/index.ts` | Logo alt text: "ATS.me - Team Invitation" → "Apply AI - Team Invitation" |
| `supabase/functions/job-group-xml-feed/index.ts` | Fallback `BASE_URL`: `https://ats.me` → `https://applyai.jobs` |

After editing, redeploy: `sync-cdl-feeds`, `import-jobs-from-feed`, `social-oauth-callback`, `universal-xml-feed`, `send-welcome-email`, `send-invite-email`, `job-group-xml-feed`, `inbound-applications`.

## Fix 3 — Frontend Files with Remaining ats.me References

| File | What to fix |
|---|---|
| `src/utils/breadcrumbSchema.ts` | Base URL `https://ats.me` → `https://applyai.jobs` |
| `src/utils/exportJobUrls.ts` | `BASE_URL = 'https://ats.me'` → `'https://applyai.jobs'` |
| `src/pages/public/JobDetailsPage.tsx` | `ogImage="https://ats.me/og-jobs.png"` → `applyai.jobs` |
| `src/pages/public/ContactPage.tsx` | Schema URLs, email addresses displayed (`sales@ats.me` → `sales@applyai.jobs`), SEO canonical/OG, text content "ATS.me" → "Apply AI" |
| `src/pages/public/ResourcesPage.tsx` | Page title, schema name, SEO canonical/OG, download item titles |
| `src/pages/public/DemoPage.tsx` | Schema name, SEO canonical/OG, all "ATS.me" text content in headings and copy |
| `src/pages/public/BlogPostPage.tsx` | Author fallback name "ATS.me Team" → "Apply AI Team", SEO title/canonical/OG, publisher in schema |
| `src/pages/public/ClientsPage.tsx` | `ogImage` URL |
| `src/utils/roiCalculatorGenerator.ts` | "With ATS.me" column header (appears ~15 times), support email, instructions text |
| `src/components/voice/demo/transcriptData.ts` | Agent dialogue strings "Welcome to ATS.me" / "apply with ATS.me" → "Apply AI" |

## Fix 4 — Database Logo URLs (3 records)

The following 3 clients in the database have `logo_url` values pointing to `https://ats-me.lovable.app/logos/...` which will break if that subdomain is ever decommissioned. A SQL UPDATE is needed:

```sql
UPDATE clients
SET logo_url = 'https://applyai.jobs/logos/pemberton-truck-lines.png'
WHERE id = '67cadf11-8cce-41c6-8e19-7d2bb0be3b03';

UPDATE clients  
SET logo_url = 'https://applyai.jobs/logos/jbtclogo.webp'
WHERE id = 'b2a29507-32a6-4f5e-85d6-a7e6ffac3c52';

UPDATE clients
SET logo_url = 'https://applyai.jobs/logos/danny-herman.png'
WHERE id = '1d54e463-4d7f-4a05-8189-3e33d0586dea';
```

Note: The actual image files (`pemberton-truck-lines.png`, `jbtclogo.webp`, `danny-herman.png`) must exist at `https://applyai.jobs/logos/`. If they are not already in `public/logos/`, we will need to keep the `ats-me.lovable.app` URLs intact until the images are migrated. We will update the database URLs to point to `applyai.jobs` since the `public/logos/` directory should be serving these files from the same deployment.

## Implementation Order

1. Fix `cors-config.ts` — add `applyai.jobs` to allowlist, wildcard fallback (fixes the live embed breakage immediately)
2. Fix `inbound-applications/index.ts` — update origin check
3. Fix frontend files (breadcrumbSchema, exportJobUrls, 7 public pages, roiCalculatorGenerator, transcriptData)
4. Fix edge functions (sync-cdl-feeds, import-jobs-from-feed, social-oauth-callback, universal-xml-feed, send-welcome-email, send-invite-email, job-group-xml-feed)
5. Run SQL UPDATE for the 3 client logo URLs in the database
6. Redeploy all 8 affected edge functions

## Technical Notes

- The `ats.me` email addresses (`sales@ats.me`, `support@ats.me`) shown on the Contact page are display-only contact links. These should change to `@applyai.jobs` in the UI, but only if you have those email aliases configured. We will update the displayed text — confirm if you want this.
- The `ROI Calculator XLSX` has "With ATS.me" as a column header throughout; changing it means the XLSX template regenerates with "With Apply AI" — this is a cosmetic-only content change.
- The voice transcript data (`transcriptData.ts`) is demo audio transcript text, not live agent script — updating it only changes the visual demo on the audio showcase page.
- `public/logos/` directory will be checked to confirm the logo images exist before committing the DB update.
