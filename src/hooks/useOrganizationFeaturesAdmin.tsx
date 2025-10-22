import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { OrganizationFeaturesService } from '@/features/organizations/services/organizationFeaturesService';
import {
  OrganizationFeature,
  FeatureUpdatePayload,
} from '@/features/organizations/types/features.types';
import { getAllFeatures } from '@/features/organizations/config/organizationFeatures.config';

/**
 * Hook for managing organization features (admin only)
 * Provides CRUD operations for feature management
 */
export const useOrganizationFeaturesAdmin = (organizationId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch organization features
  const featuresQuery = useQuery({
    queryKey: ['organization-features-admin', organizationId],
    queryFn: async (): Promise<OrganizationFeature[]> => {
      if (!organizationId) return [];

      try {
        return await OrganizationFeaturesService.fetchOrganizationFeatures(
          organizationId
        );
      } catch (error: any) {
        console.error('Failed to fetch organization features:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load features',
          variant: 'destructive',
        });
        throw error;
      }
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Update features mutation
  const updateFeaturesMutation = useMutation({
    mutationFn: async ({
      orgId,
      features,
    }: {
      orgId: string;
      features: FeatureUpdatePayload;
    }) => {
      await OrganizationFeaturesService.updateOrganizationFeatures(
        orgId,
        features
      );
    },
    onSuccess: () => {
      // Invalidate all feature-related queries
      queryClient.invalidateQueries({
        queryKey: ['organization-features-admin'],
      });
      queryClient.invalidateQueries({ queryKey: ['organization-features'] });
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      
      toast({
        title: 'Success',
        description: 'Organization features have been successfully updated.',
      });
    },
    onError: (error: any) => {
      console.error('Failed to update features:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update features',
        variant: 'destructive',
      });
    },
  });

  // Get available features from centralized config
  const availableFeatures = getAllFeatures();

  return {
    // Data
    features: featuresQuery.data || [],
    availableFeatures,
    
    // State
    isLoading: featuresQuery.isLoading,
    isError: featuresQuery.isError,
    error: featuresQuery.error,
    
    // Mutations
    updateFeatures: updateFeaturesMutation.mutateAsync,
    isUpdating: updateFeaturesMutation.isPending,
    
    // Utilities
    refetch: featuresQuery.refetch,
  };
};
