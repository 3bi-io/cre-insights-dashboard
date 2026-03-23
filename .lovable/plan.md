

# Fix Jobs Not Showing in R.E. Garrison Client Dashboard

## Problem
The recent change to `JobPerformanceSection.tsx` merged the job query to include `platforms(name)` and `job_categories(name)` joins. However, `job_listings` has no foreign key to `platforms` (and no `platform_id` column), so the Supabase query fails silently, returning no data.

## Fix

### Update `src/features/dashboard/components/client-portal/JobPerformanceSection.tsx`

Remove the invalid `platforms(name)` join from the query. Keep `job_categories(name)` only if `category_id` has a proper foreign key — but since there are no FK constraints on `job_listings` at all, remove both joins and just use `select('*')`:

```
- .select('*, platforms(name), job_categories(name)')
+ .select('*')
```

This restores the working query while keeping the merged single-query approach.

