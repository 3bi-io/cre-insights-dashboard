/**
 * useApplications Hook
 * 
 * Unified hook for application data fetching and CRUD operations.
 * Uses standardized query keys and proper React Query patterns.
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { applicationsService, CreateApplicationData, UpdateApplicationData } from '../services/ApplicationsService';
import { queryKeys } from '@/lib/queryKeys';

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
 * Hook for application data fetching and CRUD mutations.
 * Uses standardized query keys for cache consistency.
 */
export function useApplications(options?: UseApplicationsOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [allApplications, setAllApplications] = React.useState<any[]>([]);

  // Build query key from filters
  const queryKey = queryKeys.applications.list({ ...options?.filters, page });

  // Query for fetching applications with filters
  const {
    data: queryData,
    isLoading: loading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await applicationsService.getApplications({
        ...options?.filters,
        page
      });
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    enabled: options?.enabled !== false,
    staleTime: 2 * 60 * 1000 // 2 minutes
  });

  // Accumulate applications as pages load
  React.useEffect(() => {
    if (queryData?.data) {
      if (page === 1) {
        setAllApplications(queryData.data);
      } else {
        setAllApplications(prev => [...prev, ...queryData.data]);
      }
    }
  }, [queryData, page]);

  const applications = allApplications;
  const totalCount = queryData?.totalCount || 0;
  const hasMore = queryData?.hasMore || false;
  const error = queryError as Error | null;
  const initialized = !loading;

  // Invalidate all application-related queries
  const invalidateApplications = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateApplicationData) => {
      const response = await applicationsService.createApplication(data);
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    onSuccess: () => {
      invalidateApplications();
      toast({
        title: "Success",
        description: "Application created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create application",
        variant: "destructive",
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateApplicationData }) => {
      const response = await applicationsService.updateApplication(id, data);
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    onSuccess: () => {
      invalidateApplications();
      toast({
        title: "Success",
        description: "Application updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update application",
        variant: "destructive",
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await applicationsService.deleteApplication(id);
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    onSuccess: () => {
      invalidateApplications();
      toast({
        title: "Success",
        description: "Application deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete application",
        variant: "destructive",
      });
    }
  });

  // Wrapper methods
  const createApplication = (data: CreateApplicationData) => {
    createMutation.mutate(data);
  };

  const updateApplication = (id: string, data: UpdateApplicationData) => {
    updateMutation.mutate({ id, data });
  };

  const deleteApplication = (id: string) => {
    deleteMutation.mutate(id);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const refresh = async () => {
    setPage(1);
    setAllApplications([]);
    await refetch();
  };

  const clearError = () => {
    // Error clearing handled by react-query
  };

  const reset = () => {
    setPage(1);
    setAllApplications([]);
    queryClient.removeQueries({ queryKey: queryKeys.applications.all });
  };

  const reviewApplication = async (
    id: string, 
    status: 'reviewed' | 'interviewing' | 'hired' | 'rejected', 
    notes?: string
  ) => {
    const result = await applicationsService.reviewApplication(id, status, notes);
    if (!result.error) {
      refresh();
    }
    return result;
  };

  const getApplicationStats = async (jobId?: string) => {
    return await applicationsService.getApplicationStats(jobId);
  };

  return {
    // Data
    applications,
    totalCount,
    hasMore,
    loading,
    error,
    initialized,
    currentPage: page,

    // Actions
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
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Cache utilities
    invalidateApplications,
  };
}

export default useApplications;
