/**
 * useApplicationsMutations Hook
 * 
 * Handles CRUD mutations for applications.
 * Separated from data fetching for clean architecture.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { applicationsService, CreateApplicationData, UpdateApplicationData } from '../services/ApplicationsService';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook for application CRUD mutations only.
 * Use usePaginatedApplications for data fetching.
 */
export function useApplicationsMutations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const reviewApplication = async (
    id: string, 
    status: 'reviewed' | 'interviewing' | 'hired' | 'rejected', 
    notes?: string
  ) => {
    const result = await applicationsService.reviewApplication(id, status, notes);
    if (!result.error) {
      invalidateApplications();
    }
    return result;
  };

  const getApplicationStats = async (jobId?: string) => {
    return await applicationsService.getApplicationStats(jobId);
  };

  return {
    // Actions
    createApplication,
    updateApplication,
    deleteApplication,
    reviewApplication,
    getApplicationStats,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Cache utilities
    invalidateApplications,
  };
}

export default useApplicationsMutations;
