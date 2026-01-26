
# Fix Applications Overview Dashboard

## Problem Summary

Based on the screenshot and code analysis, the Applications dashboard has several UX issues:

1. **Incorrect Statistics Display**: The overview cards show stats calculated from only the first 50 loaded applications (due to pagination), not the full 473 applications in the database
2. **Non-Interactive Cards**: Status and category cards are purely informational with no click-to-filter capability
3. **Missing Status Filter**: The status filter (`setStatusFilter`) exists in the hook but is not exposed in the UI
4. **Visual Inconsistencies**: Text colors use hardcoded values (e.g., `text-gray-600`) instead of theme-aware classes

---

## Solution Overview

Create a dedicated `useApplicationStats` hook that fetches aggregate statistics from the database for ALL applications (not just the paginated subset), make the overview cards clickable to filter the list, add a status filter dropdown, and improve visual consistency.

---

## Implementation Plan

### Phase 1: Create Application Stats Hook

**New File: `src/features/applications/hooks/useApplicationStats.ts`**

Create a dedicated React Query hook to fetch global application statistics:

```typescript
// Fetch aggregate stats from database
// Returns: total, byStatus (pending, reviewed, etc.), byCategory (D, SC, SR, N/A)
// Supports organization filtering for org admins
// Uses staleTime to avoid excessive refetching
```

This hook will:
- Query ALL applications (not paginated)
- Calculate status counts server-side
- Calculate category counts by fetching `cdl`, `age`, `exp` fields
- Support organization filtering
- Use React Query with `staleTime: 30000` for caching

### Phase 2: Update ApplicationsOverview Component

**File: `src/components/applications/ApplicationsOverview.tsx`**

**Changes:**
1. Accept new props for click handlers: `onStatusClick`, `onCategoryClick`, `activeStatusFilter`, `activeCategoryFilter`
2. Add `totalCount` prop to display true database total in badge
3. Make status cards clickable with hover states and cursor-pointer
4. Make category cards clickable with hover states
5. Highlight active filter with visual indicator (ring/border)
6. Fix text colors to use theme-aware classes (`text-muted-foreground` instead of `text-gray-600`)

```typescript
interface ApplicationsOverviewProps {
  statusCounts?: Record<string, number>;
  categoryCounts?: Record<string, number>;
  totalCount?: number;
  onStatusClick?: (status: string) => void;
  onCategoryClick?: (category: string) => void;
  activeStatusFilter?: string;
  activeCategoryFilter?: string;
}
```

### Phase 3: Update ApplicationsSearch Component

**File: `src/components/applications/ApplicationsSearch.tsx`**

**Changes:**
1. Add status filter dropdown (Pending, Reviewed, Interviewed, Hired, Rejected)
2. Accept `statusFilter` and `onStatusChange` props
3. Reorder filters: Status | Category | Source (logical grouping)

### Phase 4: Update ApplicationsPage Integration

**File: `src/features/applications/pages/ApplicationsPage.tsx`**

**Changes:**
1. Import and use new `useApplicationStats` hook
2. Pass global stats to `ApplicationsOverview` instead of client-side calculated values
3. Wire up click handlers from overview cards to filter setters
4. Add status filter to pagination filters for server-side filtering
5. Pass active filter states to overview for visual highlighting

### Phase 5: Update Pagination Hook

**File: `src/features/applications/hooks/usePaginatedApplications.tsx`**

**Changes:**
1. Add `status` to server-side filtering (currently only filters client-side)
2. Ensure status filter is included in query key for proper cache invalidation

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/features/applications/hooks/useApplicationStats.ts` | Dedicated hook for fetching aggregate statistics |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/applications/ApplicationsOverview.tsx` | Add interactivity, fix colors, accept new props |
| `src/components/applications/ApplicationsSearch.tsx` | Add status filter dropdown |
| `src/features/applications/pages/ApplicationsPage.tsx` | Wire up stats hook and click handlers |
| `src/features/applications/hooks/usePaginatedApplications.tsx` | Add status to server filters |
| `src/features/applications/hooks/index.ts` | Export new hook |

---

## Technical Details

### useApplicationStats Hook Structure

```typescript
interface ApplicationStatsFilters {
  organizationId?: string;
}

interface ApplicationStats {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}

export const useApplicationStats = (filters: ApplicationStatsFilters = {}) => {
  return useQuery({
    queryKey: ['application-stats', filters],
    queryFn: async () => {
      // Fetch minimal fields needed for aggregation
      const query = supabase
        .from('applications')
        .select('status, cdl, age, exp, job_listings!inner(organization_id)')
        
      // Apply org filter if provided
      if (filters.organizationId) {
        query.eq('job_listings.organization_id', filters.organizationId)
      }
      
      const { data, error } = await query
      
      // Aggregate results
      return {
        total: data.length,
        byStatus: calculateStatusCounts(data),
        byCategory: calculateCategoryCounts(data)
      }
    },
    staleTime: 30000, // 30 seconds
  });
};
```

### Clickable Card Styling

```typescript
// Status card with click handler
<Card 
  key={status}
  className={cn(
    "cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
    activeStatusFilter === status && "ring-2 ring-primary border-primary"
  )}
  onClick={() => onStatusClick?.(activeStatusFilter === status ? 'all' : status)}
>
```

### Server-Side Status Filtering

```typescript
// In usePaginatedApplications
if (filters.status && filters.status !== 'all') {
  query = query.eq('status', filters.status);
}
```

---

## Expected Outcome

After implementation:

1. **Accurate Statistics**: Overview cards display counts for ALL 473 applications, not just loaded 50
2. **Interactive Filtering**: Clicking a status/category card filters the application list
3. **Status Filter Dropdown**: New dropdown in search bar for explicit status selection
4. **Visual Feedback**: Active filter highlighted with ring/border on corresponding card
5. **Toggle Behavior**: Clicking active filter card clears that filter (returns to "all")
6. **Theme Consistency**: All text uses theme-aware color classes
7. **Smooth UX**: Cards have hover states indicating interactivity

---

## UI/UX Improvements Summary

| Before | After |
|--------|-------|
| Stats show 50 (loaded page only) | Stats show 473 (all applications) |
| Cards are static/informational | Cards are clickable filters |
| No status filter in UI | Status filter dropdown added |
| Hardcoded gray text colors | Theme-aware muted-foreground colors |
| No visual indication of active filters | Ring highlight on active filter cards |
