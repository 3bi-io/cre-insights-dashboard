
# /jobs Page Refactoring Plan

## Overview

The public `/jobs` page (`src/pages/public/JobsPage.tsx`) is a key entry point for jobseekers. After reviewing the codebase, I've identified several areas for improvement focusing on code organization, performance, maintainability, and alignment with established patterns.

## Current State Analysis

### What's Working Well
- Pagination with infinite scroll via `usePaginatedPublicJobs`
- Mobile-responsive design with `MobileFilterSheet`
- SEO implementation with structured data
- Voice application integration
- Client and location filtering

### Areas for Improvement

1. **Code Organization**: The page component is 338 lines with inline state management, filtering logic, and rendering all in one file
2. **Pattern Consistency**: Not using the standardized `DataLoadingStateHandler` component for loading/error/empty states
3. **Duplicate Logic**: Category filtering happens client-side redundantly (also done in hook)
4. **Performance**: Locations are computed from loaded jobs rather than fetched from backend
5. **Type Safety**: Using `any` for job types throughout
6. **Separation of Concerns**: Filter state management mixed with rendering logic

## Refactoring Plan

### Phase 1: Extract Custom Hook for Job Page State

Create a dedicated hook `usePublicJobsPage` to encapsulate all state management:

```text
src/features/jobs/hooks/usePublicJobsPage.ts
```

This hook will manage:
- Filter states (search, location, client, sort)
- Integration with `usePaginatedPublicJobs`
- Location options derived from jobs
- Client fetching logic
- Sorting logic (currently inline in component)

### Phase 2: Extract Filter Components

Create reusable filter components in the jobs feature:

```text
src/features/jobs/components/public/
├── JobFiltersDesktop.tsx     // Desktop filter row
├── JobFiltersState.tsx       // Filter state provider/types
├── JobSortSelect.tsx         // Reusable sort dropdown
└── index.ts                  // Barrel exports
```

### Phase 3: Define Proper Types

Create a proper type definition for public job listings:

```text
src/features/jobs/types/publicJob.ts
```

This replaces the scattered `any` types with a proper interface that includes:
- Core job fields
- Related organization and client data
- Voice agent availability flag
- Category information

### Phase 4: Refactor Main Component

Update `JobsPage.tsx` to:

1. Use `DataLoadingStateHandler` for consistent loading/error/empty states
2. Delegate state management to the new hook
3. Use extracted filter components
4. Apply proper TypeScript types
5. Reduce component size to ~150 lines focused on composition

### Phase 5: Optimize Performance

1. **Memoize filter computations** - Wrap expensive operations in `useMemo`
2. **Debounce search input** - Already partially implemented but can be standardized
3. **Move sorting to backend** - Pass sort option to `usePaginatedPublicJobs` hook so sorting happens in the database query rather than client-side
4. **Lazy load voice panel** - Only import `VoiceApplicationPanel` when voice is actually initiated

### Phase 6: Update Hook Integration

Modify `usePaginatedPublicJobs` to:
- Accept sort option and apply ordering in the query
- Use standardized query keys from `queryKeys.ts`
- Add proper return types

## Technical Details

### New File Structure

```text
src/features/jobs/
├── components/
│   ├── public/
│   │   ├── JobFiltersDesktop.tsx
│   │   ├── JobSortSelect.tsx
│   │   └── index.ts
│   └── index.ts (update exports)
├── hooks/
│   ├── usePublicJobsPage.ts (new)
│   └── index.ts (update exports)
├── types/
│   ├── publicJob.ts (new)
│   └── index.ts (new)
└── index.ts (update exports)
```

### Key Code Changes

**1. Type Definition (publicJob.ts)**

```typescript
export interface PublicJob {
  id: string;
  title?: string;
  job_title?: string;
  job_summary?: string;
  description?: string;
  city?: string;
  state?: string;
  location?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_type?: string | null;
  job_type?: string | null;
  created_at: string;
  dest_city?: string;
  dest_state?: string;
  organizations?: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
  } | null;
  clients?: {
    id: string;
    name: string;
    logo_url?: string;
  } | null;
  job_categories?: {
    name: string;
  } | null;
  voiceAgent?: { global: boolean };
}
```

**2. Hook Integration (usePublicJobsPage.ts)**

```typescript
export interface PublicJobsPageState {
  // Filters
  searchTerm: string;
  locationFilter: string;
  clientFilter: string;
  sortBy: SortOption;
  
  // Setters
  setSearchTerm: (value: string) => void;
  setLocationFilter: (value: string) => void;
  setClientFilter: (value: string) => void;
  setSortBy: (value: SortOption) => void;
  
  // Data
  jobs: PublicJob[];
  totalCount: number;
  locations: string[];
  clients: { id: string; name: string }[];
  
  // Loading states
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  
  // Actions
  loadMore: () => void;
}
```

**3. Updated usePaginatedPublicJobs**

Add sorting to the database query:

```typescript
interface UsePaginatedPublicJobsParams {
  searchTerm?: string;
  locationFilter?: string;
  categoryFilter?: string;
  clientFilter?: string;
  sortBy?: 'recent' | 'title' | 'salary-high' | 'salary-low';
}

// In the query:
const orderConfig = {
  'recent': { column: 'created_at', ascending: false },
  'title': { column: 'title', ascending: true },
  'salary-high': { column: 'salary_max', ascending: false },
  'salary-low': { column: 'salary_min', ascending: true },
};

query = query.order(
  orderConfig[sortBy].column, 
  { ascending: orderConfig[sortBy].ascending }
);
```

**4. Simplified JobsPage Structure**

```typescript
const JobsPage = () => {
  const pageState = usePublicJobsPage();
  const voice = useElevenLabsVoice();

  return (
    <>
      <SEO ... />
      <StructuredData ... />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 lg:py-8">
          <JobsPageHeader 
            totalCount={pageState.totalCount} 
          />
          
          <MobileFilterSheet {...pageState} />
          <JobFiltersDesktop {...pageState} />
          
          <DataLoadingStateHandler
            data={pageState.jobs}
            isLoading={pageState.isLoading}
            isError={false}
            emptyTitle="No Jobs Found"
            emptyDescription="Try adjusting your search criteria"
            emptyIcon={Building2}
          >
            {(jobs) => (
              <JobsGrid 
                jobs={jobs}
                onVoiceApply={voice.startVoiceApplication}
                isVoiceConnected={voice.isConnected}
                selectedJobId={voice.selectedJob?.jobId}
              />
            )}
          </DataLoadingStateHandler>
          
          {pageState.hasMore && (
            <LoadMoreButton 
              onClick={pageState.loadMore}
              isLoading={pageState.isFetchingMore}
            />
          )}
          
          <VoiceApplicationPanel {...voice} />
        </div>
      </div>
    </>
  );
};
```

## Benefits

1. **Maintainability**: Smaller, focused components are easier to test and modify
2. **Reusability**: Filter components and hooks can be reused in candidate portal
3. **Performance**: Server-side sorting reduces client-side computation
4. **Type Safety**: Proper TypeScript types catch errors at compile time
5. **Consistency**: Aligns with established patterns like `DataLoadingStateHandler`
6. **Testing**: Extracted hooks can be unit tested independently

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/public/JobsPage.tsx` | Refactor to use new components and hooks |
| `src/hooks/usePaginatedPublicJobs.tsx` | Add sort parameter and return types |
| `src/features/jobs/hooks/usePublicJobsPage.ts` | New file - page state hook |
| `src/features/jobs/types/publicJob.ts` | New file - type definitions |
| `src/features/jobs/components/public/JobFiltersDesktop.tsx` | New file - desktop filters |
| `src/features/jobs/components/public/index.ts` | New file - barrel exports |
| `src/features/jobs/hooks/index.ts` | Update exports |
| `src/features/jobs/index.ts` | Update exports |

## Implementation Order

1. Create type definitions first (foundational)
2. Update `usePaginatedPublicJobs` with sort support
3. Create `usePublicJobsPage` hook
4. Extract filter components
5. Refactor `JobsPage.tsx` to compose everything
6. Test end-to-end functionality
