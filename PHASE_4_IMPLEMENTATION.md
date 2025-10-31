# Phase 4: Database & Performance - Implementation Guide

## Overview
Phase 4 focuses on database optimization, pagination implementation, bundle size reduction, and caching strategies to improve application performance and scalability.

---

## 1. Database Indexes ✅

### Purpose
Improve query performance for frequently accessed data patterns.

### Implementation

```sql
-- Execute via Supabase SQL Editor or migration

-- =====================================================
-- Performance Indexes for Common Query Patterns
-- =====================================================

-- Applications: Filter by organization and status
CREATE INDEX IF NOT EXISTS idx_applications_org_status_created 
ON applications(organization_id, status, created_at DESC) 
WHERE deleted_at IS NULL;

-- Applications: Search by recruiter
CREATE INDEX IF NOT EXISTS idx_applications_recruiter 
ON applications(recruiter_id, status, applied_at DESC) 
WHERE deleted_at IS NULL;

-- Applications: Full-text search on names and email
CREATE INDEX IF NOT EXISTS idx_applications_search 
ON applications USING gin(
  to_tsvector('english', 
    coalesce(first_name, '') || ' ' || 
    coalesce(last_name, '') || ' ' || 
    coalesce(applicant_email, '')
  )
);

-- Job Listings: Active jobs by organization
CREATE INDEX IF NOT EXISTS idx_jobs_org_status 
ON job_listings(organization_id, status, created_at DESC) 
WHERE deleted_at IS NULL;

-- Job Listings: Search by platform
CREATE INDEX IF NOT EXISTS idx_jobs_platform 
ON job_listings(platform_id, status) 
WHERE deleted_at IS NULL;

-- Daily Spend: Analytics queries
CREATE INDEX IF NOT EXISTS idx_daily_spend_date_job 
ON daily_spend(date, job_listing_id, amount DESC);

-- Daily Spend: Organization aggregations
CREATE INDEX IF NOT EXISTS idx_daily_spend_org_date 
ON daily_spend(organization_id, date DESC);

-- Profiles: Lookup by organization
CREATE INDEX IF NOT EXISTS idx_profiles_organization 
ON profiles(organization_id, enabled) 
WHERE deleted_at IS NULL;

-- User Roles: Permission checks
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup 
ON user_roles(user_id, organization_id, role);

-- Meta Campaigns: Account-based queries
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_account 
ON meta_campaigns(account_id, status, created_at DESC);

-- Meta Daily Spend: Time-series analytics
CREATE INDEX IF NOT EXISTS idx_meta_daily_spend_account_date 
ON meta_daily_spend(account_id, date_start DESC);

-- Webhooks: Configuration lookups
CREATE INDEX IF NOT EXISTS idx_webhook_configs_user 
ON webhook_configurations(user_id, enabled) 
WHERE deleted_at IS NULL;

-- SMS Magic Links: Token validation
CREATE INDEX IF NOT EXISTS idx_sms_links_phone_token 
ON sms_magic_links(phone_number, token, expires_at DESC) 
WHERE used = false;
```

### Testing Index Performance

```sql
-- Before adding indexes, check query plan
EXPLAIN ANALYZE
SELECT * FROM applications 
WHERE organization_id = 'some-uuid' 
AND status = 'new' 
ORDER BY created_at DESC 
LIMIT 50;

-- After adding indexes, verify index usage
-- Look for "Index Scan" instead of "Seq Scan" in the query plan
```

---

## 2. Pagination Implementation

### Purpose
Reduce memory usage and improve response times for large datasets.

### Cursor-Based Pagination (Recommended)

**File**: `src/hooks/usePaginatedApplications.tsx`

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

interface PaginationFilters {
  organizationId?: string;
  status?: string;
  search?: string;
}

const PAGE_SIZE = 50;

export const usePaginatedApplications = (filters: PaginationFilters) => {
  return useInfiniteQuery({
    queryKey: queryKeys.applications.list(filters),
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('applications')
        .select(`
          id,
          first_name,
          last_name,
          applicant_email,
          phone,
          status,
          applied_at,
          job_listing_id,
          job_listings(title)
        `)
        .order('applied_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      // Apply filters
      if (filters.organizationId) {
        query = query.eq('organization_id', filters.organizationId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.search) {
        query = query.or(
          `first_name.ilike.%${filters.search}%,` +
          `last_name.ilike.%${filters.search}%,` +
          `applicant_email.ilike.%${filters.search}%`
        );
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data,
        nextCursor: data.length === PAGE_SIZE ? pageParam + PAGE_SIZE : undefined,
        totalCount: count,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });
};
```

**Usage in Component**:

```typescript
import { usePaginatedApplications } from '@/hooks/usePaginatedApplications';

const ApplicationsList = () => {
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isLoading 
  } = usePaginatedApplications({ 
    organizationId: 'some-uuid',
    status: 'new' 
  });

  return (
    <div>
      {data?.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.data.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </React.Fragment>
      ))}

      {hasNextPage && (
        <Button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </div>
  );
};
```

### Infinite Scroll Implementation

```typescript
import { useInView } from 'react-intersection-observer';

const ApplicationsList = () => {
  const { data, fetchNextPage, hasNextPage } = usePaginatedApplications();
  const { ref, inView } = useInView();

  React.useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  return (
    <div>
      {/* ... render applications ... */}
      
      {/* Trigger element for infinite scroll */}
      <div ref={ref} className="h-10" />
    </div>
  );
};
```

---

## 3. Bundle Size Optimization

### Current Large Dependencies

```bash
# Analyze bundle size
npm run build

# Install analyzer
npm install -D rollup-plugin-visualizer

# Update vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ 
      open: true,
      gzipSize: true,
      brotliSize: true 
    })
  ]
});
```

### Large Dependencies to Optimize

1. **Recharts (~200KB)** - Lazy load charts
```typescript
const RevenueChart = React.lazy(() => import('@/components/analytics/RevenueChart'));

<Suspense fallback={<ChartSkeleton />}>
  <RevenueChart data={data} />
</Suspense>
```

2. **XLSX (~500KB)** - Load only when needed
```typescript
const exportToExcel = async (data: any[]) => {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(data);
  // ... rest of export logic
};
```

3. **jsPDF (~400KB)** - Lazy load PDF generation
```typescript
const generatePDF = async () => {
  const jsPDF = (await import('jspdf')).default;
  const doc = new jsPDF();
  // ... PDF generation
};
```

4. **Radix UI** - Tree-shake unused components
```typescript
// Instead of importing everything:
import * from '@radix-ui/react-dropdown-menu';

// Import only what you need:
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent 
} from '@radix-ui/react-dropdown-menu';
```

### Code Splitting by Route

```typescript
// src/components/routing/AppRoutes.tsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Applications = lazy(() => import('@/pages/Applications'));
const Analytics = lazy(() => import('@/pages/Analytics'));

const AppRoutes = () => (
  <Suspense fallback={<LoadingScreen />}>
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/applications" element={<Applications />} />
      <Route path="/analytics" element={<Analytics />} />
    </Routes>
  </Suspense>
);
```

---

## 4. Caching Strategy

### React Query Cache Configuration

**File**: `src/App.tsx` (already implemented)

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});
```

### Cache Invalidation Patterns

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';

const useApplicationMutations = () => {
  const queryClient = useQueryClient();

  const updateApplication = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase
        .from('applications')
        .update(data)
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific application
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.applications.detail(variables.id) 
      });
      
      // Invalidate list queries that might contain this application
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.applications.lists() 
      });
    },
  });

  return { updateApplication };
};
```

### Optimistic Updates

```typescript
const updateApplicationStatus = useMutation({
  mutationFn: async ({ id, status }) => {
    const { error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  },
  onMutate: async ({ id, status }) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ 
      queryKey: queryKeys.applications.detail(id) 
    });

    // Snapshot previous value
    const previousData = queryClient.getQueryData(
      queryKeys.applications.detail(id)
    );

    // Optimistically update
    queryClient.setQueryData(
      queryKeys.applications.detail(id),
      (old: any) => ({ ...old, status })
    );

    return { previousData };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previousData) {
      queryClient.setQueryData(
        queryKeys.applications.detail(variables.id),
        context.previousData
      );
    }
  },
  onSettled: (_, __, variables) => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.applications.detail(variables.id) 
    });
  },
});
```

### Prefetching Strategy

```typescript
const ApplicationsList = () => {
  const queryClient = useQueryClient();

  const { data: applications } = useQuery({
    queryKey: queryKeys.applications.list(),
    queryFn: fetchApplications,
  });

  // Prefetch application details on hover
  const prefetchApplication = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.applications.detail(id),
      queryFn: () => fetchApplicationDetail(id),
      staleTime: 60 * 1000, // Consider fresh for 1 minute
    });
  };

  return (
    <div>
      {applications?.map((app) => (
        <div 
          key={app.id}
          onMouseEnter={() => prefetchApplication(app.id)}
        >
          <ApplicationCard application={app} />
        </div>
      ))}
    </div>
  );
};
```

---

## 5. Performance Monitoring

### Add Performance Metrics

```typescript
// src/utils/performance.ts
export const measurePerformance = (metricName: string, fn: () => void) => {
  const startTime = performance.now();
  fn();
  const duration = performance.now() - startTime;
  
  if (import.meta.env.MODE === 'development') {
    console.log(`${metricName}: ${duration.toFixed(2)}ms`);
  }
  
  // Send to analytics in production
  if (import.meta.env.MODE === 'production') {
    // analytics.track('performance_metric', { metric: metricName, duration });
  }
};

// Usage
measurePerformance('ApplicationList Render', () => {
  renderApplicationsList();
});
```

### Core Web Vitals Tracking

```typescript
// src/utils/vitals.ts
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

export const initVitalsTracking = () => {
  onCLS(console.log); // Cumulative Layout Shift
  onFID(console.log); // First Input Delay
  onLCP(console.log); // Largest Contentful Paint
  onFCP(console.log); // First Contentful Paint
  onTTFB(console.log); // Time to First Byte
  
  // In production, send to analytics
};
```

---

## Testing Checklist

### Database Performance
- [ ] Run EXPLAIN ANALYZE on critical queries
- [ ] Verify indexes are being used
- [ ] Test with large datasets (10K+ records)
- [ ] Monitor query execution times

### Pagination
- [ ] Test infinite scroll with slow network
- [ ] Verify no duplicate data loading
- [ ] Test filter changes reset pagination
- [ ] Check memory usage with large lists

### Bundle Size
- [ ] Measure initial bundle size
- [ ] Verify code splitting works
- [ ] Test lazy loading components
- [ ] Check gzipped size < 500KB for main bundle

### Caching
- [ ] Verify stale data is refetched appropriately
- [ ] Test optimistic updates rollback on error
- [ ] Check cache invalidation on mutations
- [ ] Monitor cache hit rates

---

## Expected Results

### Performance Improvements
- **Query Times**: 70-90% faster for paginated lists
- **Initial Load**: 30-50% faster with code splitting
- **Memory Usage**: 60% reduction with pagination
- **Bundle Size**: 40% smaller with tree-shaking

### Metrics Targets
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1
- Time to Interactive (TTI): < 3.5s

---

## Next Steps

1. **Immediate** (This week):
   - Add database indexes via SQL migration
   - Implement pagination for applications list
   - Add lazy loading to charts

2. **Short-term** (Next 2 weeks):
   - Optimize bundle size (lazy load heavy deps)
   - Implement optimistic updates for forms
   - Add performance monitoring

3. **Long-term** (Next month):
   - Service Worker for offline support
   - Advanced caching strategies
   - Performance budget monitoring
