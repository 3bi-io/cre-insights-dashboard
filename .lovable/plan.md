

# Deploy Google-Ready Jobs & Create Weekly Indexing Cron

## Current State
- **518 total active listings** across 4 organizations
- **514 Google-ready** (have title + location): Hayes (421), Aspen Analytics (53), CR England (40)
- **4 not ready** (Career Now Brands -- missing location data)
- The `google-indexing` edge function already supports `publish_from_feed` action (reads sitemap XML and submits each URL to Google Indexing API)
- The `google-jobs-xml` edge function generates per-org sitemaps at `?organization_id=...`
- No existing Google indexing cron job exists
- `GOOGLE_SERVICE_ACCOUNT_JSON` secret is required (already referenced in existing code)

## Plan

### Step 1: Create `google-indexing-weekly` Edge Function
A lightweight cron-targeted function that:
1. Queries all organizations with active, non-hidden job listings that have title + location (Google-ready)
2. For each org, fetches the sitemap from `google-jobs-xml?organization_id={id}`
3. Parses `<loc>` URLs from the XML
4. Submits each URL to the Google Indexing API as `URL_UPDATED` (using the same JWT/OAuth logic from `google-indexing-trigger`)
5. Logs results per org (success/failure counts) to `feed_access_logs`
6. Skips orgs with 0 ready jobs

This is separate from the admin-facing `google-indexing` function (which requires auth). The cron function uses service role internally and needs no JWT verification.

### Step 2: Register Weekly Cron Job via SQL
Create a `pg_cron` job named `google-indexing-weekly` that runs every Sunday at 6:00 AM UTC:
```
0 6 * * 0
```
Calls the new `google-indexing-weekly` edge function with the anon key.

### Step 3: One-Time Initial Deploy
After the cron is set up, trigger an immediate run to submit all 514 Google-ready URLs now (not waiting until next Sunday).

### Files
- **New**: `supabase/functions/google-indexing-weekly/index.ts`
- **Modified**: `supabase/config.toml` (add `[functions.google-indexing-weekly]` with `verify_jwt = false`)

### Technical Notes
- Google Indexing API has a daily quota of 200 URLs per default. With 514 URLs, the weekly function will batch across multiple days if needed, or process all if quota allows. The function will handle 429 rate limits gracefully.
- The function reuses the proven JWT/OAuth pattern from `google-indexing-trigger` for authentication with Google's API.
- Career Now Brands (4 jobs, no location) will be auto-excluded until location data is added.

