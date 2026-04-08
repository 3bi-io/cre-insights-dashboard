

# Fix Category Filter Bug + Dropdown Z-Index

## Problem
Two issues found during verification:

1. **Category filter is broken** — The dropdown passes category names (e.g., "Driver Recruitment") but the Supabase query filters by `category_id` expecting a UUID. Selecting any category returns zero results.

2. **Dropdown may not open on some devices** — The Radix Select portal needs to render above the Leaflet map's z-index layers. The filters container has `z-[1000]` but the SelectContent portal renders at body level without explicit z-index.

## Data Verification (Confirmed Complete)
- **16 companies** loaded correctly from `public_client_info`
- **4 categories** loaded correctly from `job_categories`: Driver Recruitment, Administrative, Customer Service, Cybersecurity
- **Search** queries correctly against `title`, `job_title`, `job_summary`
- **Company filter** works correctly (passes UUID `company.id` to `client_id` filter)

## Fix 1: Category Filter — Pass ID Instead of Name

**Files**: `src/hooks/useJobMapData.ts`, `src/components/map/MapFilters.tsx`

Change `uniqueCategories` to return `{ id, name }` objects (like companies) instead of plain strings:

```typescript
// useJobMapData.ts — uniqueCategories
const uniqueCategories = useMemo(() => {
  const categories = new Map<string, { id: string; name: string }>();
  allJobs.forEach((job: MapJob) => {
    if (job.category_id && job.job_categories?.name) {
      categories.set(job.category_id, { id: job.category_id, name: job.job_categories.name });
    }
  });
  return Array.from(categories.values()).sort((a, b) => a.name.localeCompare(b.name));
}, [allJobs]);
```

Update `MapFilters.tsx` to use `category.id` as the Select value and `category.name` as the display label — same pattern as the company filter.

Update `MapFiltersProps` interface: change `categories: string[]` to `categories: { id: string; name: string }[]`.

## Fix 2: Dropdown Z-Index

Add `className="z-[1001]"` to all `SelectContent` elements in `MapFilters.tsx` to ensure the dropdown renders above the map overlay layer.

## Impact
- Category filtering will actually work (currently silently broken)
- No schema changes needed
- Company filter and search are already correct

