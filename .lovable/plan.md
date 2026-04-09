

# Import CDL JobCast Experience Fields into Applications

## Current State

The CDL JobCast payload sends experience data in multiple fields:
- `exp` — text like "48+ Months", "6 Months", "More than 3 months" (most common, 7/150 records populated)
- `experience` — numeric months like "36" (rare, 1/150)
- `months` — numeric months like "36" (rare, 1/150)
- `driving_experience_years` — integer years like "3" (rare, 1/150)

The handler already maps `exp` and `driving_experience_years` to their respective DB columns. However, when the payload uses `experience` or `months` instead (and `exp` is absent), those values are lost.

## Changes

### 1. Update `supabase/functions/_shared/hayes-client-handler.ts`

Enhance the experience mapping to use `experience` and `months` as fallbacks:

```typescript
// Build a normalized exp value from available fields
const expValue = data.exp 
  || (data.months ? `${data.months} Months` : null) 
  || (data.experience ? `${data.experience} months` : null);

// Parse driving_experience_years from numeric fields if not directly provided
const drivingExpYears = data.driving_experience_years 
  || (data.months ? Math.floor(parseInt(data.months) / 12) : null)
  || (data.experience ? Math.floor(parseInt(data.experience) / 12) : null);
```

Then use these computed values in the application data:
```typescript
exp: expValue || null,
driving_experience_years: drivingExpYears || null,
```

### 2. Backfill existing R.E. Garrison applications

Update records that have `experience` or `months` in `raw_payload` but empty `exp`/`driving_experience_years` columns:

```sql
-- Backfill exp from raw_payload experience/months
UPDATE applications
SET 
  exp = COALESCE(exp, 
    CASE WHEN raw_payload->>'months' IS NOT NULL THEN (raw_payload->>'months') || ' Months' END,
    CASE WHEN raw_payload->>'experience' IS NOT NULL THEN (raw_payload->>'experience') || ' months' END
  ),
  driving_experience_years = COALESCE(driving_experience_years,
    CASE WHEN raw_payload->>'months' IS NOT NULL THEN FLOOR((raw_payload->>'months')::int / 12)::int END,
    CASE WHEN raw_payload->>'experience' IS NOT NULL THEN FLOOR((raw_payload->>'experience')::int / 12)::int END
  )
WHERE job_listing_id IN (
  SELECT id FROM job_listings WHERE client_id = 'be8b645e-d480-4c22-8e75-b09a7fc1db7a'
)
AND exp IS NULL
AND (raw_payload->>'experience' IS NOT NULL OR raw_payload->>'months' IS NOT NULL);
```

### 3. Redeploy `hayes-inbound` edge function

### Files modified
- `supabase/functions/_shared/hayes-client-handler.ts` — enhanced experience field mapping
- New migration — backfill existing records

### Result
All CDL JobCast experience data (`exp`, `experience`, `months`, `driving_experience_years`) will be captured and displayed in the R.E. Garrison dashboard, regardless of which field the payload uses.

