

# Fix External Apply Detection

## Problem
The current logic `const isExternalApply = !!job.apply_url` treats ALL jobs with an `apply_url` as external. But most jobs have internal `apply_url` values (e.g. `https://applyai.jobs/apply?job_id=...&utm_source=rippling...`). Only 3 jobs have truly external URLs (cdljobnow.com). This breaks:
- Apply button rendering (opens as external link instead of internal navigation)
- Voice Apply button hidden for all jobs with any `apply_url`

## Fix

### 1. `src/components/public/PublicJobCard.tsx`
Change the `isExternalApply` check to detect truly external URLs:
```ts
const isExternalApply = !!job.apply_url && !job.apply_url.includes('applyai.jobs');
```
Keep `applyUrl` logic as-is — internal `apply_url` values with UTM params should still be used (they route to the same internal apply page).

### 2. `src/pages/public/JobDetailsPage.tsx`
Same change to `isExternalApply`:
```ts
const isExternalApply = !!job.apply_url && !job.apply_url.includes('applyai.jobs');
```

For internal `apply_url` values, use `<Link>` with just the path+query portion (strip the domain) so React Router handles it. Update `applyUrl`:
```ts
const applyUrl = job.apply_url
  ? (job.apply_url.includes('applyai.jobs')
      ? new URL(job.apply_url).pathname + new URL(job.apply_url).search
      : job.apply_url)
  : `/apply?job_id=${job.id}`;
```

### 3. No other file changes needed
`JobSidebar.tsx` and `StickyApplyCTA.tsx` already handle `isExternalApply` and `showVoiceButton` props correctly — they just need the right values from parents.

