

# Fix Google Indexing & Deploy All 813 Jobs Immediately

## Root Cause Analysis

The function ran successfully on 2026-03-28 at 02:16 UTC but **all submissions failed** with errors that got logged as `[object Object]` (a logging bug). Three critical issues:

### Issue 1: Logger argument order bug
Line 222 calls `logger.error('message', { context })` but the signature is `error(message, error?, context?)`. The context object is treated as the `error` parameter, so the actual Google API response body is lost.

### Issue 2: Edge function timeout
813 jobs x 100ms delay = 81 seconds minimum. Supabase edge functions timeout at ~60 seconds. The function only processed 2 of 4 organizations before timing out. Career Now Brands (299 jobs) was never reached.

### Issue 3: Google API rejections
Every submission returned an error (likely 403). The Google Indexing API requires the service account to have **verified ownership** of the domain `applyai.jobs` in Google Search Console. Without this, all submissions are rejected.

## Plan

### Step 1: Fix the logging bug
Update the `logger.error` calls in `google-indexing-weekly` to use correct argument order so we can see the actual Google API error response.

### Step 2: Fix the timeout problem
- Reduce delay from 100ms to 50ms
- Add a `max_per_run` parameter (default 200, matching Google's daily quota)
- Prioritize new jobs (never-indexed first, sorted by `created_at` DESC)
- Process all orgs' delta jobs in a single flat list instead of per-org loops to avoid wasting time on org overhead

### Step 3: Redeploy and trigger immediately
Deploy the fixed function and invoke it to get the actual Google API error response. This will tell us definitively whether:
- (a) The service account credentials work but domain isn't verified (403)
- (b) The credentials are invalid (401)
- (c) Some other error

### Step 4: If domain verification is the issue
Provide instructions to add the service account email as an **owner** in Google Search Console for `applyai.jobs`. This is a manual step in the Google Search Console dashboard.

## Files Changed

| File | Change |
|---|---|
| `supabase/functions/google-indexing-weekly/index.ts` | Fix logger calls, reduce delays, add max_per_run cap, flatten job processing |

## Important Note
If Google returns 403 errors, the `GOOGLE_SERVICE_ACCOUNT_JSON` service account's `client_email` must be added as a **verified owner** of `https://applyai.jobs` in [Google Search Console](https://search.google.com/search-console). No code change can fix this -- it's a Google-side configuration requirement for the Indexing API.

