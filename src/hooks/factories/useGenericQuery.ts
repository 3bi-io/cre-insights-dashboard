/**
 * Generic Query Hook Factory
 * Creates type-safe, reusable query hooks with consistent behavior
 */

import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { UseQueryResponse } from '@/types/hook.types';

export interface QueryConfig<TData = unknown> {
  queryKey: QueryKey;
  queryFn: () => Promise<TData>;
  staleTime?: number;
  cacheTime?: number;
  refetchInterval?: number | false;
  refetchOnWindowFocus?: boolean;
  enabled?: boolean;
}

/**
 * Factory function to create a custom query hook
 * @param config Query configuration
 * @returns Custom hook function
 */
export function createQueryHook<TData = unknown>(
  config: Omit<QueryConfig<TData>, 'enabled'>
) {
  return function useGenericQuery(options?: { enabled?: boolean }): UseQueryResponse<TData> {
    const result = useQuery<TData, Error>({
      queryKey: config.queryKey,
      queryFn: config.queryFn,
      staleTime: config.staleTime ?? 5 * 60 * 1000, // Default 5 minutes
      gcTime: config.cacheTime ?? 10 * 60 * 1000, // Default 10 minutes (renamed from cacheTime)
      refetchInterval: config.refetchInterval ?? false,
      refetchOnWindowFocus: config.refetchOnWindowFocus ?? true,
      enabled: options?.enabled ?? true,
    } as UseQueryOptions<TData, Error>);

    return {
      data: result.data,
      isLoading: result.isLoading,
      isError: result.isError,
      isFetching: result.isFetching,
      isSuccess: result.isSuccess,
      error: result.error,
      refetch: result.refetch,
      status: result.status === 'pending' ? 'loading' : result.status,
    };
  };
}

/**
 * Factory for organization-scoped queries
 * Automatically includes organization ID in query key
 */
export function createOrgScopedQueryHook<TData = unknown>(
  baseKey: string,
  queryFn: (orgId?: string) => Promise<TData>,
  options?: Partial<QueryConfig<TData>>
) {
  return function useOrgQuery(organizationId?: string): UseQueryResponse<TData> {
    const result = useQuery<TData, Error>({
      queryKey: [baseKey, organizationId],
      queryFn: () => queryFn(organizationId),
      staleTime: options?.staleTime ?? 5 * 60 * 1000,
      gcTime: options?.cacheTime ?? 10 * 60 * 1000,
      refetchInterval: options?.refetchInterval ?? false,
      refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
      enabled: !!organizationId,
    } as UseQueryOptions<TData, Error>);

    return {
      data: result.data,
      isLoading: result.isLoading,
      isError: result.isError,
      isFetching: result.isFetching,
      isSuccess: result.isSuccess,
      error: result.error,
      refetch: result.refetch,
      status: result.status === 'pending' ? 'loading' : result.status,
    };
  };
}

/**
 * Factory for authenticated queries
 * Automatically includes user ID in query key and disables when not authenticated
 */
export function createAuthQueryHook<TData = unknown>(
  baseKey: string,
  queryFn: (userId: string) => Promise<TData>,
  options?: Partial<QueryConfig<TData>>
) {
  return function useAuthQuery(userId?: string): UseQueryResponse<TData> {
    const result = useQuery<TData, Error>({
      queryKey: [baseKey, userId],
      queryFn: () => queryFn(userId!),
      staleTime: options?.staleTime ?? 5 * 60 * 1000,
      gcTime: options?.cacheTime ?? 10 * 60 * 1000,
      refetchInterval: options?.refetchInterval ?? false,
      refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
      enabled: !!userId,
    } as UseQueryOptions<TData, Error>);

    return {
      data: result.data,
      isLoading: result.isLoading,
      isError: result.isError,
      isFetching: result.isFetching,
      isSuccess: result.isSuccess,
      error: result.error,
      refetch: result.refetch,
      status: result.status === 'pending' ? 'loading' : result.status,
    };
  };
}
