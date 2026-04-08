

# Route Church Transportation "Apply" to Detailed Form

## What's changing
When a user clicks "Apply" on a Church Transportation job listing, they'll be sent to `/apply/detailed` instead of the default `/apply` quick form.

## Approach

**Database update** — Set `apply_url` on the Church Transportation job listing to an internal URL pointing to the detailed form:

```
apply_url = 'https://applyai.jobs/apply/detailed?job_listing_id={job_id}&client_id=dffb0ef4-07a0-494f-9790-ef9868e143c7'
```

This already works on **public-facing pages** (`PublicJobCard`, `JobDetailsPage`, `JobSidebar`) — they check `apply_url`, detect `applyai.jobs`, and convert it to a relative path for SPA navigation.

**Code updates** — The **candidate portal** pages ignore `apply_url` and hardcode navigation to `/apply`. Three `handleApply` functions need to respect the job's `apply_url` field:

### Files to modify

1. **`src/features/candidate/pages/JobSearchPage.tsx`** — Update `handleApply` to check `job.apply_url` before defaulting to `/apply`
2. **`src/features/candidate/pages/SavedJobsPage.tsx`** — Same pattern
3. **`src/features/candidate/pages/JobDetailPage.tsx`** — Same pattern
4. **`src/features/candidate/components/JobCard.tsx`** — Pass `apply_url` through the `onApply` callback (or handle internally)

### Implementation detail

In each `handleApply`, add logic mirroring the public pages:

```typescript
const handleApply = (jobId: string, orgSlug?: string, applyUrl?: string) => {
  if (applyUrl) {
    if (applyUrl.includes('applyai.jobs')) {
      const u = new URL(applyUrl);
      navigate(u.pathname + u.search, { state: { internal: true } });
    } else {
      window.open(applyUrl, '_blank', 'noopener,noreferrer');
    }
    return;
  }
  // existing default logic
  navigate(`/apply?${params.toString()}`, { state: { internal: true } });
};
```

Update `JobCard` to pass `job.apply_url` in the `onApply` call, and update `JobDetailPage` similarly.

### Migration

A single SQL migration to set the `apply_url` on the Church Transportation job listing.

