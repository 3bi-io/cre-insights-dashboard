

## Plan: Fix Job Title — Replace "CO" with "LP" for R.E. Garrison Jobs

### Problem
R.E. Garrison job titles from CDL JobCast arrive with "CO" (Company) prefix (e.g., "CO - Solo") but should display "LP" (Lease Purchase) since this is a Lease Purchase program. The `cdl-jobcast-inbound` endpoint stores raw feed titles without applying any title template or correction.

### Root Cause
Two sync paths handle R.E. Garrison jobs:
1. **`sync-cdl-feeds`** — Has `CLIENT_TITLE_TEMPLATES` that overrides titles entirely, but the template produces a long marketing title, not the short code format.
2. **`cdl-jobcast-inbound`** — Stores `job.title` verbatim (line 203), with no title correction at all.

Neither path corrects "CO" → "LP" for the R.E. Garrison Lease Purchase program.

### Changes

#### 1. Add title correction map in both sync functions
Add a client-specific title replacement map for R.E. Garrison that replaces "CO" with "LP" in job type prefixes:

**`supabase/functions/sync-cdl-feeds/index.ts`**
- After the title template logic (lines 314–322), add a replacement step: if the client is R.E. Garrison and the title starts with "CO", replace "CO" with "LP".
- This handles cases where the title template is not applied (e.g., when state is missing).

**`supabase/functions/cdl-jobcast-inbound/index.ts`**
- Before building `jobData` (line 202), apply the same "CO" → "LP" replacement for R.E. Garrison's client ID.

#### 2. Migration to fix existing job titles
Run an UPDATE on `job_listings` to replace "CO" with "LP" at the start of titles for R.E. Garrison jobs that still have the wrong prefix.

```sql
UPDATE job_listings
SET title = 'LP' || substring(title from 3),
    updated_at = now()
WHERE client_id = 'be8b645e-d480-4c22-8e75-b09a7fc1db7a'
  AND title LIKE 'CO %';
```

### Files changed (2 code + 1 migration)
- `supabase/functions/sync-cdl-feeds/index.ts` — add "CO" → "LP" replacement after title template logic
- `supabase/functions/cdl-jobcast-inbound/index.ts` — add "CO" → "LP" replacement before jobData construction
- New migration — fix existing "CO" titles to "LP" for R.E. Garrison jobs

