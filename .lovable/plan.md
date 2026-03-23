

# Update Jobs to Use External Apply URLs

## Overview
Set external apply URLs for 3 job listings and update the frontend to redirect to external URLs when `apply_url` is set.

## Data Changes

Update `apply_url` for these jobs via SQL insert tool:
- `861bce97-...` → `https://cdljobnow.com/jobs/4802/werner-enterprises-dedicated-cdl-a-truck-driver-multiple-options-available?cc=48648m681`
- `3212c229-...` → `https://cdljobnow.com/jobs/7891/tmc-transportation-cdl-a-flatbed-driver?cc=48649barT`
- `923781c4-...` → `https://cdljobnow.com/jobs/6023/hub-group-intermodal-cdl-a-driver-east?cc=48650041b`

## Code Changes

### 1. `src/pages/public/JobDetailsPage.tsx`
Change the `applyUrl` construction (line 77) to check for an external `apply_url` first:
```
const applyUrl = job.apply_url || `/apply?job_id=${job.id}`;
const isExternalApply = !!job.apply_url;
```
Pass `isExternalApply` to `JobSidebar` and `StickyApplyCTA`.

### 2. `src/features/jobs/components/public/JobSidebar.tsx`
When `isExternalApply` is true, render an `<a href={applyUrl} target="_blank">` instead of `<Link to={applyUrl}>`.

### 3. `src/components/public/StickyApplyCTA.tsx`
Same change — use `<a href>` with `target="_blank"` for external URLs instead of `<Link to>`.

### 4. `src/hooks/useJobDetails.tsx`
Add `apply_url` to the `JobDetails` interface so the field is available from the query (the `select('*')` already fetches it).

## Technical Detail
- The `useJobDetails` hook already uses `select('*')` which includes `apply_url`, but the TypeScript interface doesn't declare it — needs adding.
- External links must use `<a>` tags, not React Router `<Link>`, to navigate outside the SPA.

