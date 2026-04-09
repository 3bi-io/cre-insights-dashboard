

# Fix Experience-to-Months Parsing and Backfill driving_experience_years

## Problem

The `driving_experience_years` column is null or wrong for most R.E. Garrison applications despite `exp` having parseable values like "48+ Months", "5 years", "6 Months", "More than 3 months". The current code only derives `driving_experience_years` from numeric `months`/`experience` fields but never parses the text `exp` field.

Current data:
- "48+ Months" → `driving_experience_years` = null (should be 4)
- "5 years" → `driving_experience_years` = 0 (should be 5)
- "6 Months" → `driving_experience_years` = null (should be 0)
- "More than 3 months" → `driving_experience_years` = 3 (correct, came from numeric field)
- 144 records have both `exp` and `driving_experience_years` as null

## Changes

### 1. Add `parseExpToYears()` helper in `hayes-client-handler.ts`

A function that extracts years from the text `exp` value:

```typescript
function parseExpToYears(exp: string | null): number | null {
  if (!exp) return null;
  const lower = exp.toLowerCase().trim();
  
  // Match "N years" or "N+ years"
  const yearsMatch = lower.match(/(\d+)\+?\s*years?/);
  if (yearsMatch) return parseInt(yearsMatch[1]);
  
  // Match "N months" or "N+ months" or "more than N months"
  const monthsMatch = lower.match(/(\d+)\+?\s*months?/);
  if (monthsMatch) return Math.floor(parseInt(monthsMatch[1]) / 12);
  
  return null;
}
```

### 2. Update experience mapping in handler (lines 316-323)

Use `parseExpToYears` as the final fallback for `driving_experience_years`:

```typescript
const expValue = data.exp 
  || (data.months ? `${data.months} Months` : null) 
  || (data.experience ? `${data.experience} months` : null);

const drivingExpYears = data.driving_experience_years 
  || (data.months ? Math.floor(parseInt(data.months) / 12) : null)
  || (data.experience ? Math.floor(parseInt(data.experience) / 12) : null)
  || parseExpToYears(expValue);
```

Then use these computed values in `applicationData`.

### 3. Backfill existing records

Use the data modification tool to update `driving_experience_years` from the `exp` text for R.E. Garrison applications:

```sql
UPDATE applications
SET driving_experience_years = CASE
  WHEN exp ~* '(\d+)\+?\s*years?' THEN (regexp_match(exp, '(\d+)\+?\s*years?', 'i'))[1]::int
  WHEN exp ~* '(\d+)\+?\s*months?' THEN FLOOR((regexp_match(exp, '(\d+)\+?\s*months?', 'i'))[1]::int / 12)::int
  ELSE driving_experience_years
END
WHERE job_listing_id IN (
  SELECT id FROM job_listings WHERE client_id = 'be8b645e-d480-4c22-8e75-b09a7fc1db7a'
)
AND exp IS NOT NULL
AND (driving_experience_years IS NULL OR driving_experience_years = 0);
```

### 4. Redeploy `hayes-inbound` edge function

### Files modified
- `supabase/functions/_shared/hayes-client-handler.ts` — add `parseExpToYears` helper, refactor experience mapping
- Data update via insert tool — backfill `driving_experience_years` from `exp` text

### Result
All 7 records with `exp` values will get correct `driving_experience_years` (e.g., "48+ Months" → 4, "5 years" → 5). Future applications will also have `driving_experience_years` auto-derived from any text `exp` value.

