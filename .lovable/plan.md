

## Plan: Fix Missing Job Titles for R.E. Garrison Auto-Created Listings

### Problem
When inbound applications arrive via `hayes-client-handler.ts` for R.E. Garrison with a `job_id` that doesn't match an existing listing, the `application-processor.ts` creates a new listing with a fallback title of `Job {job_id}` (e.g., "Job 14558J14038"). This happens because no `jobTitle` is passed to `findOrCreateJobListing`. There are currently **14 job listings** with this problem.

Additionally, `hayes-client-handler.ts` job sync (lines 177, 199) doesn't apply the CO→LP title fix that was added to `sync-cdl-feeds` and `cdl-jobcast-inbound`.

### Changes

#### 1. Fix `hayes-client-handler.ts` — Pass proper title when creating listings
In the `processApplication` function (line 258), pass the R.E. Garrison title template as `jobTitle` to `findOrCreateJobListing`, with state suffix if available:
```
jobTitle: "CDL-A Drivers: Top Tier Lease Purchase Program! $0 Down, No Credit Check!" + state suffix
```

#### 2. Fix `hayes-client-handler.ts` — Apply CO→LP in job sync
In the `syncJobsFromFeed` function, apply the same CO→LP title replacement before writing to `job_listings` (lines 177 and 199), matching the fix in `sync-cdl-feeds`.

#### 3. Fix existing data — Update 14 "Job %" titles
Update the 14 R.E. Garrison listings with `title LIKE 'Job %'` to use the proper title template with their state:
```sql
UPDATE job_listings
SET title = 'CDL-A Drivers: Top Tier Lease Purchase Program! $0 Down, No Credit Check! | ' || state,
    updated_at = now()
WHERE client_id = 'be8b645e-d480-4c22-8e75-b09a7fc1db7a'
  AND title LIKE 'Job %'
  AND state IS NOT NULL;
```

### Technical Detail
- The title template is defined in `sync-cdl-feeds/index.ts` as `CLIENT_TITLE_TEMPLATES['be8b645e-...']`
- The `findOrCreateJobListing` function in `application-processor.ts` accepts an optional `jobTitle` param — it just isn't being passed
- Trigger suppression (`trg_google_indexing_notify`) needed for the data update per project conventions

### Files changed (1 code file + 1 data update)
- `supabase/functions/_shared/hayes-client-handler.ts` — pass `jobTitle` in `processApplication`, add CO→LP fix in `syncJobsFromFeed`
- Data update via insert tool — fix 14 existing "Job %" titles

