import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { BaseFeatureService } from '../services/BaseFeatureService';
import { FilterOptions, PaginatedResponse } from '../types/feature.types';
import { useFeatureState } from './useFeatureState';

export interface UseFeatureServiceOptions {
  featureName: string;
  queryKey: string;
  enabled?: boolean;
  refetchOnMount?: boolean;
  staleTime?: number;
}

export function useFeatureService<T = any>(
  service: BaseFeatureService,
  options: UseFeatureServiceOptions
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    data,
    loading,
    error,
    initialized,
    setData,
    setError,
    setLoading,
    clearError,
    reset
  } = useFeatureState<PaginatedResponse<T>>({
    featureName: options.featureName
  });

  // Query for fetching data
  const {
    data: queryData,
    isLoading: queryLoading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: [options.queryKey],
    queryFn: async () => {
      const response = await (service as any).getAll();
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    enabled: options.enabled !== false,
    staleTime: options.staleTime || 5 * 60 * 1000, // 5 minutes default
    refetchOnMount: options.refetchOnMount !== false
  });

  // Sync query state with feature state
  useEffect(() => {
    if (queryLoading) {
      setLoading(true);
    } else if (queryError) {
      setError(queryError as any);
    } else if (queryData) {
      setData(queryData);
    }
  }, [queryData, queryLoading, queryError, setData, setError, setLoading]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<T>) => {
      const response = await (service as any).create(data);
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [options.queryKey] });
      toast({
        title: "Success",
        description: `${options.featureName} created successfully`,
      });
    },
    onError: (error: any) => {
      setError(error);
      toast({
        title: "Error",
        description: error.message || `Failed to create ${options.featureName}`,
        variant: "destructive",
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<T> }) => {
      const response = await (service as any).update(id, data);
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [options.queryKey] });
      toast({
        title: "Success",
        description: `${options.featureName} updated successfully`,
      });
    },
    onError: (error: any) => {
      setError(error);
      toast({
        title: "Error",
        description: error.message || `Failed to update ${options.featureName}`,
        variant: "destructive",
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await (service as any).delete(id);
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [options.queryKey] });
      toast({
        title: "Success",
        description: `${options.featureName} deleted successfully`,
      });
    },
    onError: (error: any) => {
      setError(error);
      toast({
        title: "Error",
        description: error.message || `Failed to delete ${options.featureName}`,
        variant: "destructive",
      });
    }
  });

  const refresh = async () => {
    clearError();
    await refetch();
  };

  return {
    // State
    data: data?.data || [],
    totalCount: data?.totalCount || 0,
    hasMore: data?.hasMore || false,
    loading: loading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    error,
    initialized,

    // Actions
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    refresh,
    clearError,
    reset,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}