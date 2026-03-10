

## /jobs Page Improvements Plan

### 1. Server-Side Location Filter Options
**Problem**: Locations are derived from currently loaded jobs (max 50 per page), giving users an incomplete filter list.
**Fix**: Add a query to fetch distinct `city, state` combinations from `job_listings` where `status = 'active'` and `is_hidden = false`. Similar pattern to how `clients` are fetched from `public_client_info`.

### 2. Debounce Search Input
**Problem**: Every keystroke fires a new paginated query, causing unnecessary API calls and UI flicker.
**Fix**: Add a 300ms debounce to `searchTerm` before passing it to `usePaginatedPublicJobs`. Use a `useDebouncedValue` hook — keep the input responsive with local state, debounce the query trigger.

### 3. Remove Duplicate `formatSalary`
**Problem**: `PublicJobCard` defines its own `formatSalary` inline (lines 47-56) while `src/utils/jobDisplayUtils.ts` exports an identical function.
**Fix**: Import and use `formatSalary` from `jobDisplayUtils` in `PublicJobCard`. Delete the inline copy.

### 4. URL-Persisted Filters
**Problem**: Only `clientFilter` reads from URL params. Search, location, and sort are ephemeral — users can't share or bookmark a filtered view.
**Fix**: Sync all filter state to URL search params (`?q=`, `&location=`, `&client=`, `&sort=`). Initialize from `useSearchParams` and update params on change. This also gives browser back/forward navigation through filter states.

### 5. Expose Category Filter
**Problem**: The type system and backend support `categoryFilter`, but no UI exposes it.
**Fix**: Add a category filter dropdown to both `JobFiltersDesktop` and `MobileFilterSheet`. Fetch categories from `job_categories` table. Wire through `usePublicJobsPage`.

### Implementation Order
1. Debounce search (quick win, biggest UX impact)
2. Remove duplicate `formatSalary` (cleanup)
3. Server-side locations query
4. URL-persisted filters
5. Category filter UI

### Files to Change
| File | Change |
|------|--------|
| `src/features/jobs/hooks/usePublicJobsPage.ts` | Add debounce, URL param sync, server-side locations query, category state |
| `src/components/public/PublicJobCard.tsx` | Import shared `formatSalary`, remove inline copy |
| `src/features/jobs/components/public/JobFiltersDesktop.tsx` | Add category dropdown |
| `src/components/public/MobileFilterSheet.tsx` | Add category dropdown |
| `src/pages/public/JobsPage.tsx` | Wire category filter + chips |

