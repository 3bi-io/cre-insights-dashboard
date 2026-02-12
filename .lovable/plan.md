

# Fix Missing Hayes Applications

## Root Cause

The `usePaginatedApplications` hook in `src/features/applications/hooks/usePaginatedApplications.tsx` uses an embedded resource filter:

```typescript
query = query.eq('job_listings.organization_id', filters.organizationId);
```

Without using `!inner` in the select statement, PostgREST does **not** filter parent rows based on embedded resource conditions. This means:
- For super admins filtering by Hayes org, the filter silently fails -- applications show with `null` job_listings data, which downstream UI code may render as empty/missing.
- For org admins, `organizationId` is set to `undefined` (RLS handles scoping), so they should see data -- but the embedded `job_listings` data may still be affected.

## Database Verification

- Hayes currently has **13 applications** (7 Pemberton, 5 Danny Herman, 1 Day and Ross)
- All have valid `job_listing_id` references to Hayes job listings
- RLS policies are correctly configured
- No applications were lost -- the 18 previously deleted records were orphaned test entries with `NULL` job_listing_id

## Fix

**File: `src/features/applications/hooks/usePaginatedApplications.tsx`**

1. Change the select statement to use `!inner` join on `job_listings` so that PostgREST correctly filters parent rows when `organizationId` is specified:

```typescript
// Before
.select(`*, job_listings(...), recruiters(...)`, { count: 'exact' })
// ...
if (filters.organizationId) {
  query = query.eq('job_listings.organization_id', filters.organizationId);
}

// After - use !inner join when org filter is active
const jobJoin = filters.organizationId ? 'job_listings!inner' : 'job_listings';
.select(`*, ${jobJoin}(...), recruiters(...)`, { count: 'exact' })
// ...
if (filters.organizationId) {
  query = query.eq('job_listings.organization_id', filters.organizationId);
}
```

2. Since the select string is built inside `queryFn`, we need to make the join type dynamic based on whether `organizationId` is present.

## Technical Details

- The `!inner` modifier tells PostgREST to perform an INNER JOIN instead of a LEFT JOIN, ensuring only applications with matching job_listings are returned.
- When no `organizationId` filter is set (org admins relying on RLS), we keep the default LEFT JOIN to avoid accidentally hiding applications with edge-case job_listing states.
- This is a one-file change with no migration required.

