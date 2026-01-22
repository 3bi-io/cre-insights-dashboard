/**
 * useApplications Hook
 * 
 * @deprecated This hook is deprecated. Use the following instead:
 * - `usePaginatedApplications` for data fetching (canonical)
 * - `useApplicationsMutations` for CRUD operations
 * - `useApplicationsManagement` for UI state management
 * 
 * This file provides backward-compatible re-exports.
 */

import React from 'react';
import { usePaginatedApplications } from './usePaginatedApplications';
import { useApplicationsMutations } from './useApplicationsMutations';

export interface ApplicationFilters {
  job_id?: string;
  status?: string;
  cdl_license?: boolean;
  veteran_status?: boolean;
  experience_years_min?: number;
  city?: string;
  state?: string;
  organization_id?: string;
  search?: string;
  page?: number;
}

interface UseApplicationsOptions {
  enabled?: boolean;
  filters?: ApplicationFilters;
}

/**
 * @deprecated Use usePaginatedApplications for data and useApplicationsMutations for CRUD.
 * This hook is maintained for backward compatibility only.
 */
export function useApplications(options?: UseApplicationsOptions) {
  // Map legacy filters to pagination filters
  const paginationFilters = React.useMemo(() => ({
    organizationId: options?.filters?.organization_id,
    status: options?.filters?.status,
    search: options?.filters?.search,
    jobListingId: options?.filters?.job_id,
  }), [options?.filters]);

  // Use the canonical data hook
  const {
    data,
    isLoading: loading,
    error: queryError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = usePaginatedApplications(paginationFilters);

  // Use mutations hook
  const {
    createApplication,
    updateApplication,
    deleteApplication,
    reviewApplication,
    getApplicationStats,
    isCreating,
    isUpdating,
    isDeleting,
    invalidateApplications,
  } = useApplicationsMutations();

  // Flatten paginated data for backward compatibility
  const applications = React.useMemo(() => {
    return data?.pages.flatMap(page => page.data) || [];
  }, [data]);

  const totalCount = data?.pages[0]?.totalCount || 0;
  const hasMore = hasNextPage || false;
  const error = queryError as Error | null;
  const initialized = !loading;

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const refresh = async () => {
    await refetch();
  };

  const clearError = () => {
    // Error clearing handled by react-query
  };

  const reset = () => {
    invalidateApplications();
  };

  return {
    // Data (from usePaginatedApplications)
    applications,
    totalCount,
    hasMore,
    loading,
    error,
    initialized,
    currentPage: 1, // Legacy - pagination is now cursor-based

    // Actions (from useApplicationsMutations)
    createApplication,
    updateApplication,
    deleteApplication,
    reviewApplication,
    getApplicationStats,
    loadMore,
    refresh,
    clearError,
    reset,

    // Mutation states
    isCreating,
    isUpdating,
    isDeleting,

    // Cache utilities
    invalidateApplications,
  };
}

export default useApplications;
