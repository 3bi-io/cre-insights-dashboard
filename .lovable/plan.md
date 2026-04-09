

# Display CDL JobCast Source in R.E. Garrison Dashboard

## Problem
The `source` field on R.E. Garrison applications is hardcoded to `hayes-re-garrison-inbound`, so the dashboard shows that generic label instead of the actual originating job board (e.g., "ZipRecruiter", "TheTruckersReportJobs").

## Changes

### 1. Update `supabase/functions/_shared/hayes-client-handler.ts` (line 318)
For R.E. Garrison only, use the payload's `source` value as the application `source` field, falling back to the existing convention:

```typescript
// Before:
source: `hayes-${config.clientSlug}-inbound`,

// After:
source: data.source || `hayes-${config.clientSlug}-inbound`,
```

This applies to all Hayes clients so any client whose payload includes a granular source will benefit. If no source is in the payload, the existing routing label is preserved.

### 2. Backfill existing R.E. Garrison applications
Run a data update (via insert tool) to set `source` from `raw_payload->>'source'` for existing records:

```sql
UPDATE applications
SET source = raw_payload->>'source'
WHERE job_listing_id IN (
  SELECT id FROM job_listings WHERE client_id = 'be8b645e-d480-4c22-8e75-b09a7fc1db7a'
)
AND source = 'hayes-re-garrison-inbound'
AND raw_payload->>'source' IS NOT NULL
AND raw_payload->>'source' != '';
```

### 3. Redeploy the `hayes-inbound` edge function

## Result
The dashboard will show "ZipRecruiter", "TheTruckersReportJobs", etc. in the Source column instead of "hayes-re-garrison-inbound" (or the client name derived from it).

