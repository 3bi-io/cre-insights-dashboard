import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

interface OptimizedQueryOptions<TData, TError = Error> 
  extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  queryKey: QueryKey;
  queryFn: () => Promise<TData>;
  cacheTime?: number;
  staleTime?: number;
  background?: boolean;
  prefetch?: boolean;
}

/**
 * Optimized useQuery hook with performance enhancements
 */
export function useOptimizedQuery<TData, TError = Error>(
  options: OptimizedQueryOptions<TData, TError>
) {
  const {
    queryKey,
    queryFn,
    cacheTime = 10 * 60 * 1000, // 10 minutes
    staleTime = 5 * 60 * 1000,  // 5 minutes
    background = false,
    prefetch = false,
    ...restOptions
  } = options;

  // Memoize the query function to prevent unnecessary re-renders
  const memoizedQueryFn = useCallback(queryFn, []);

  // Memoize query options
  const queryOptions = useMemo(() => ({
    queryKey,
    queryFn: memoizedQueryFn,
    gcTime: cacheTime,
    staleTime,
    refetchOnWindowFocus: false,
    refetchOnMount: !background,
    refetchInterval: false as const,
    retry: (failureCount: number, error: TError) => {
      // Smart retry logic
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        // Don't retry client errors (4xx)
        if (status >= 400 && status < 500) return false;
      }
      return failureCount < 2;
    },
    ...restOptions,
  }), [queryKey, memoizedQueryFn, cacheTime, staleTime, background, restOptions]);

  const result = useQuery(queryOptions);

  // Enhanced return with performance metrics
  return useMemo(() => ({
    ...result,
    isStale: result.isStale,
    isCached: result.status === 'success' && !result.isLoading,
    lastFetched: result.dataUpdatedAt,
    cacheHit: result.status === 'success' && !result.isFetching && result.dataUpdatedAt > 0,
  }), [result]);
}

/**
 * Hook for paginated queries with performance optimization
 */
export function usePaginatedQuery<TData, TError = Error>(
  baseQueryKey: QueryKey,
  queryFn: (page: number, pageSize: number) => Promise<TData>,
  page: number,
  pageSize: number = 20,
  options?: Omit<OptimizedQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  const queryKey = useMemo(() => [...baseQueryKey, page, pageSize], [baseQueryKey, page, pageSize]);
  
  const memoizedQueryFn = useCallback(
    () => queryFn(page, pageSize),
    [queryFn, page, pageSize]
  );

  return useOptimizedQuery({
    queryKey,
    queryFn: memoizedQueryFn,
    staleTime: 2 * 60 * 1000, // 2 minutes for paginated data
    ...options,
  });
}

/**
 * Hook for real-time data with smart polling
 */
export function useRealTimeQuery<TData, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  intervalMs: number = 30000,
  options?: Omit<OptimizedQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  const memoizedQueryFn = useCallback(queryFn, []);

  return useOptimizedQuery({
    queryKey,
    queryFn: memoizedQueryFn,
    refetchInterval: intervalMs as number,
    refetchIntervalInBackground: false,
    staleTime: Math.max(intervalMs * 0.8, 1000), // 80% of interval or 1 second minimum
    ...options,
  });
}

/**
 * Hook for background queries that don't block UI
 */
export function useBackgroundQuery<TData, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<OptimizedQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  return useOptimizedQuery({
    queryKey,
    queryFn,
    background: true,
    staleTime: 10 * 60 * 1000, // 10 minutes for background data
    ...options,
  });
}

/**
 * Hook for dependent queries with smart sequencing
 */
export function useDependentQuery<TData, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  enabled: boolean,
  options?: Omit<OptimizedQueryOptions<TData, TError>, 'queryKey' | 'queryFn' | 'enabled'>
) {
  return useOptimizedQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}