

# Fix Map Page — Crash + Data Completeness

## Problem Summary
The /map page is completely broken with two issues:
1. **Page crashes on load** — `react-dom` ESM import error (`createPortal` not found) caused by the `optimizeDeps.exclude` added in the previous fix attempt
2. **Only 50 of 1,237 jobs load** — The map reuses the paginated jobs hook (PAGE_SIZE=50) but never calls `loadMore`, so filters/categories/markers only reflect a fraction of the data

## Data in the Database
- 1,237 active jobs across 16 clients and 4 categories
- 809 jobs have city data, 774 have state data
- Top clients: Admiral Merchants (421), Danny Herman (161), TMC (111), Werner (101), R.E. Garrison (97), Hub Group (90)

---

## Step 1: Fix the crash — Remove `optimizeDeps.exclude`

**File**: `vite.config.ts`

The `optimizeDeps.exclude` for `react-leaflet` and `@react-leaflet/core` prevents Vite from transforming their CJS imports, causing `react-dom`'s `createPortal` to fail as a named ESM export. Remove the entire `optimizeDeps` block — the custom `MarkerClusterGroup` wrapper already avoids the `react-leaflet-cluster` compatibility issue, so prebundling is safe.

## Step 2: Load ALL jobs for the map

**File**: `src/hooks/useJobMapData.ts`

Replace the `usePaginatedPublicJobs` dependency with a dedicated query that fetches all active jobs in one call (1,237 rows is small). Use a direct Supabase query with `useQuery`:

- Select: `id, title, job_title, city, state, location, salary_min, salary_max, salary_type, job_summary, created_at, client_id, category_id`
- Join: `job_categories(name)` (note: no FK, so fetch categories separately)
- Enrich with client info from `public_client_info` view
- Filter: `status=active`, `is_hidden=false`
- Apply search/client/category filters at query level
- No pagination — fetch all rows (limit 5000 as safety)

This ensures all 16 companies and 4 categories appear in the filter dropdowns, and all 1,237 jobs render on the map.

## Step 3: Verify filter dropdowns populate correctly

The existing `uniqueCompanies` and `uniqueCategories` derivations in `useJobMapData` already work correctly — they iterate over loaded jobs. Once all jobs load, all 16 companies and 4 categories will appear.

---

## Technical Detail

**Why `optimizeDeps.exclude` broke things**: When Vite excludes a dependency from prebundling, it serves the raw ESM source. `react-leaflet` v4 imports `createPortal` as a named export from `react-dom`, but `react-dom` is a CJS package — Vite's prebundler normally converts CJS→ESM, but excluded deps bypass this, causing the import to fail.

**Why a dedicated query instead of pagination**: The map needs all locations to render correctly. Paginating 50 at a time would show incomplete clusters, wrong stats, and missing filter options. 1,237 rows with minimal columns is ~100KB — well within acceptable limits for a single fetch.

