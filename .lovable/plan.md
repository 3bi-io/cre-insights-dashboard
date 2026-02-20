

# Fix: Edge Functions Not Deployed + Application Flow Issues

## Root Cause

The primary issue is that **the edge functions were never actually redeployed** after the CORS fix. The code in `cors-config.ts` is correct (updated to `applyai.jobs` + wildcard fallback), but the live deployed version still returns `Access-Control-Allow-Origin: https://ats.me`.

I confirmed this by calling the `submit-application` edge function directly -- it returned status 200 but the response header shows:
```
Access-Control-Allow-Origin: https://ats.me
```

This means:
- Applications submitted from the preview/test environment work (because `lovableproject.com` is allowed via `isLovablePreview()`)
- Applications from production (`applyai.jobs`) or embedded forms on third-party sites are **CORS-blocked by the browser** -- the server responds successfully but the browser rejects the response because the `Access-Control-Allow-Origin` header doesn't match

This explains the "failing on last submission" -- the form data is actually saved to the database, but the browser blocks the response, so the frontend never receives the success callback and shows an error or hangs.

## What Needs to Happen

### Step 1: Redeploy ALL Edge Functions (Critical)

The following 8 edge functions were edited in the previous CORS/rebrand fix but never deployed:

1. `submit-application` (uses `cors-config.ts`)
2. `inbound-applications` (has its own origin check)
3. `sync-cdl-feeds`
4. `import-jobs-from-feed`
5. `social-oauth-callback`
6. `universal-xml-feed`
7. `send-welcome-email`
8. `send-invite-email`
9. `job-group-xml-feed`

All of these import from `_shared/cors-config.ts` or have hardcoded URLs that were updated in code but not deployed.

### Step 2: Verify After Deployment

After redeploying, call `submit-application` again and confirm the `Access-Control-Allow-Origin` header returns `*` (for non-allowlisted origins) or `https://applyai.jobs` (for the production domain).

### No Code Changes Needed

The code is already correct:
- `cors-config.ts` has `applyai.jobs` in the allowlist and returns `*` for unknown origins
- `useDetailedApplicationForm.ts` now reads `job_id` correctly
- `DetailedApplicationForm.tsx` has updated URLs
- `PublicJobCard.tsx` says "View Details"

The ONLY action needed is to **deploy the edge functions** so the live environment picks up the code changes.

## Technical Details

The admin applications page fetch works fine -- RLS policies are correctly configured for super admins, org admins, recruiters, and job owners. Applications are being inserted successfully into the database (confirmed via direct DB query -- real applications from today exist). The issue is purely a CORS response header mismatch causing the browser to reject the success response, making the form appear to fail even though the data was saved.

