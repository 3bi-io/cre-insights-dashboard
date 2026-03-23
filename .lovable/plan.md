

# Fix External Apply URLs in Job Cards

## Problem
`PublicJobCard.tsx` always renders `Apply Now` as an internal `<Link to="/apply?job_id=...">`, ignoring the `apply_url` field. The 3 jobs with external URLs won't redirect correctly from the job listing page.

## Fix

### Update `src/components/public/PublicJobCard.tsx`
1. Change `applyUrl` construction to check for external URL first:
   ```
   const applyUrl = job.apply_url || `/apply?job_id=${job.id}`;
   const isExternalApply = !!job.apply_url;
   ```

2. Update the "Apply Now" button (lines 147-157) to conditionally render `<a href target="_blank">` for external URLs vs `<Link>` for internal — same pattern already used in `JobSidebar.tsx` and `StickyApplyCTA.tsx`.

No other files need changes — `JobDetailsPage`, `JobSidebar`, and `StickyApplyCTA` already handle external URLs correctly.

