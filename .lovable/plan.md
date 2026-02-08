

# Fix Applications Overview to Include Orphaned Applications

## Problem Summary

The Applications Overview dashboard shows **0** for all status and category counts because:

1. **Database Reality**: 27 total applications exist, but 18 are "orphaned" (have `job_listing_id = NULL`)
2. **Current Query Issue**: The `useApplicationStats` hook uses `job_listings!inner` which creates an INNER JOIN, automatically excluding any application without a linked job listing
3. **Result**: Only 9 of 27 applications are counted, and with organization filtering, potentially none are visible

## Solution

Change from INNER JOIN to LEFT JOIN by removing the `!inner` modifier from the Supabase query. This will include all applications regardless of whether they have a linked job listing.

---

## Technical Implementation

### File: `src/features/applications/hooks/useApplicationStats.ts`

**Change 1: Update the query to use LEFT JOIN**

Replace the current INNER JOIN query:
```typescript
let query = supabase
  .from('applications')
  .select(`
    status,
    cdl,
    age,
    exp,
    months,
    job_listings!inner(organization_id)  // INNER JOIN - excludes orphans
  `);
```

With a LEFT JOIN query:
```typescript
let query = supabase
  .from('applications')
  .select(`
    status,
    cdl,
    age,
    exp,
    months,
    job_listings(organization_id)  // LEFT JOIN - includes orphans
  `);
```

**Change 2: Update the organization filter logic**

The current filter won't work correctly with orphaned applications. Update to handle null job_listings:

```typescript
// Apply org filter if provided (only affects applications WITH job listings)
if (filters.organizationId && filters.organizationId !== 'all') {
  query = query.eq('job_listings.organization_id', filters.organizationId);
}
```

This filter will automatically exclude orphaned applications when an org filter is active (which is correct behavior since orphans don't belong to any organization).

**Change 3: Update the ApplicationRow interface**

Add the job_listings field to properly type the response:
```typescript
interface ApplicationRow {
  status: string | null;
  cdl: string | null;
  age: string | null;
  exp: string | null;
  months: string | null;
  job_listings?: { organization_id: string | null } | null;
}
```

---

## Expected Outcome

| Metric | Before | After |
|--------|--------|-------|
| Total Applications | 0 | 27 |
| Orphaned included | No | Yes |
| Org filtering | Broken | Works correctly |

When no organization filter is applied, all 27 applications will be counted. When an organization filter is applied, only applications linked to that organization's job listings will be counted (orphaned applications will be excluded, which is correct).

---

## Files Changed

| File | Change |
|------|--------|
| `src/features/applications/hooks/useApplicationStats.ts` | Remove `!inner` modifier, update interface |

