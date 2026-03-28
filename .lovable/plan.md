

# Syndication Push: Immediate + Weekly Cron

## What We're Building
1. A new **`syndication-push`** edge function that hits every free-platform XML feed URL for every organization, warming caches and logging access
2. An **immediate invocation** of that function (via `supabase--curl_edge_functions`)
3. A **weekly pg_cron job** to run it every Sunday at 5:00 AM UTC

## Free Platforms (excluding Google)
From `universal-xml-feed` VALID_FORMATS, the free syndication platforms are:
- `indeed`, `simplyhired`, `talent`, `careerjet`, `jooble`, `jobrapido`, `linkedin`, `trovit`, `recruitnet`, `adzuna`, `dice`, `wellfound`, `hcareers`, `snagajob`, `healthecareers`, `nurse`

Google is excluded — it already has `google-indexing-weekly` on its own cron.

## Implementation

### 1. Create `supabase/functions/syndication-push/index.ts`
Edge function that:
- Queries all distinct `organization_id` values from `job_listings` where `status = 'active'` and `is_hidden = false`
- For each organization, fetches the `universal-xml-feed` endpoint for each free platform format (using internal Supabase function URL)
- Logs a summary per org: how many jobs served per platform, any errors
- Returns a JSON report with totals

The function calls itself via `fetch()` to `universal-xml-feed?organization_id=X&format=Y` for each org/platform pair. Each call already logs to `feed_access_logs`, so we get full audit trail automatically.

### 2. Immediately invoke via `curl_edge_functions`
After deploying, call it once to trigger the initial push for all orgs across all platforms.

### 3. Weekly cron job (migration)
Schedule via `pg_cron` + `pg_net`:
```sql
SELECT cron.schedule(
  'syndication-push-weekly',
  '0 5 * * 0',  -- Sunday 5 AM UTC
  $$ SELECT net.http_post(
    url:='https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/syndication-push',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer <anon_key>"}'::jsonb,
    body:='{}'::jsonb
  ); $$
);
```

## Technical Details

### Edge function logic (pseudocode)
```text
1. Query distinct org IDs from active job_listings
2. Define FREE_PLATFORMS array (16 platforms, no 'google')
3. For each org:
   a. For each platform:
      - fetch(universal-xml-feed?organization_id=X&format=Y)
      - Record status code + job count from response
   b. Add 100ms delay between orgs to avoid self-rate-limiting
4. Return JSON summary
```

### Files changed
- **Create**: `supabase/functions/syndication-push/index.ts`
- **Create**: Migration SQL for weekly cron schedule

### No database schema changes needed
`feed_access_logs` already captures all feed requests with format, org, job count, and timestamps.

