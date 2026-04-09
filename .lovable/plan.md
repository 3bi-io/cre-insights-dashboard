

# Route CDL JobCast Payload `source` to `utm_source` for R.E. Garrison

## Problem
When CDL JobCast forwards applications for R.E. Garrison, the payload includes a `source` field with the actual originating job board (e.g., "ZipRecruiter", "TheTruckersReportJobs", "Adzuna"). However, the `utm_source` is hardcoded to `'cdl_jobcast'` for all applications, losing the granular source attribution. The UI displays `utm_source`, so recruiters only see "cdl_jobcast" instead of the real source.

## Solution
Use the payload's `source` field as `utm_source` when present, falling back to `'cdl_jobcast'` only when the payload doesn't specify a source.

## Changes

### 1. Update `supabase/functions/_shared/hayes-client-handler.ts`
In the `processApplication` function (~line 298-301), change the UTM attribution logic:

**Before:**
```typescript
const utmSource = 'cdl_jobcast';
```

**After:**
```typescript
const utmSource = data.source || 'cdl_jobcast';
```

This preserves the payload's `source` value (e.g., "ZipRecruiter") as `utm_source` while keeping `cdl_jobcast` as the fallback. The `source` field on the application record stays as `hayes-re-garrison-inbound` for internal routing — only `utm_source` changes.

### 2. Backfill existing R.E. Garrison applications (migration)
Run a SQL migration to update existing applications where `raw_payload->>'source'` contains a usable value but `utm_source` is stuck at `cdl_jobcast`:

```sql
UPDATE applications
SET utm_source = raw_payload->>'source'
WHERE job_listing_id IN (
  SELECT id FROM job_listings WHERE client_id = 'be8b645e-d480-4c22-8e75-b09a7fc1db7a'
)
AND utm_source = 'cdl_jobcast'
AND raw_payload->>'source' IS NOT NULL
AND raw_payload->>'source' != '';
```

### Files modified
- `supabase/functions/_shared/hayes-client-handler.ts` — use payload source as `utm_source`
- New migration — backfill existing records

