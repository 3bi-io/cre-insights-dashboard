

# Fix Job Click Not Opening Dialog on Client Dashboard

## Problem
In `JobPerformanceSection.tsx`, clicking a job calls `handleJobClick` which looks up the job in a separate `fullJobs` query. If that query returns empty (due to RLS or timing), the `if (full)` check fails silently and the dialog never opens.

## Changes

### Update `src/features/dashboard/components/client-portal/JobPerformanceSection.tsx`

1. **Merge the two queries**: Instead of running a separate `fullJobs` query, fetch the full job data (including `platforms(name), job_categories(name)`) in the existing `jobPerf` query. This eliminates the dependency on a second query that may not have loaded.

2. **Update `handleJobClick`**: Look up the job from `jobPerf` data directly (which already has the full fields) instead of from a separate `fullJobs` array.

3. **Add fallback**: If for any reason the full data isn't available, still open the dialog with whatever data is available (at minimum `id`, `title`, `status`) so the click always does something visible.

