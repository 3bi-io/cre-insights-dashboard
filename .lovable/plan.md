

## Automated Rippling ATS Sync for AspenView

### Problem
AspenView Technology Partners has 87 job listings on their Rippling ATS careers page (`ats.rippling.com/es-419/aspenview`) but zero listings in the platform's `job_listings` table. Rippling has no public JSON API, so we need to scrape the careers page.

### Approach
Build a `sync-rippling-feeds` edge function modeled after the existing `sync-cdl-feeds` pattern, using Firecrawl (already configured) to extract job data from the Rippling HTML page, then upsert into `job_listings`.

### Architecture

```text
pg_cron (hourly) → sync-rippling-feeds edge function
                         │
                         ├─ Scrape ats.rippling.com/es-419/aspenview via Firecrawl
                         │   (JSON extraction schema for structured output)
                         │
                         ├─ Deduplicate by Rippling job UUID (from URL path)
                         │
                         ├─ Upsert into job_listings
                         │   - client_id: 82513316-... (AspenView)
                         │   - organization_id: 9335c64c-... (Aspen Analytics)
                         │   - source: 'rippling'
                         │
                         ├─ Deactivate stale jobs (not in feed after 3 empty syncs)
                         │
                         └─ Log to feed_sync_logs
```

### Implementation Details

**1. New Edge Function: `sync-rippling-feeds/index.ts`**
- Uses Firecrawl scrape API with JSON extraction schema to pull structured job data (title, department, location, apply URL) from each page
- Rippling page is paginated (5 pages); will scrape pages 1-5 sequentially using `?page=N` parameter or extract pagination URLs
- Extracts Rippling job UUID from URLs like `/jobs/af7ab95f-b971-45eb-b51f-209364342b91` to use as `job_id` for dedup
- Follows the same sync patterns as `sync-cdl-feeds`: insert new, update existing, deactivate stale, generate UTM apply URLs, log to `feed_sync_logs`
- Maps departments (Technology, Sales, Business Operations, People) to appropriate job categories
- Handles "Remoto" locations by parsing them into remote_type field

**2. Config: `supabase/config.toml`**
- Add `[functions.sync-rippling-feeds]` with `verify_jwt = false` (for cron invocation)

**3. Cron Job (via SQL insert)**
- Schedule hourly sync: `0 * * * *`
- Calls the edge function with service role auth

**4. No new secrets needed**
- `FIRECRAWL_API_KEY` already configured
- `LOVABLE_API_KEY` available for optional AI categorization

### Key Differences from CDL Sync
- CDL uses XML feeds; Rippling requires HTML scraping via Firecrawl
- Rippling jobs have UUID-based IDs in URLs (reliable dedup key)
- Multiple departments (not just trucking) — uses AI categorization from the existing `firecrawl-job-import` pattern
- Paginated results require multiple scrape calls

### Files to Create/Modify
1. **Create** `supabase/functions/sync-rippling-feeds/index.ts` — main sync logic
2. **Modify** `supabase/config.toml` — add function config
3. **SQL insert** — pg_cron schedule for hourly execution

