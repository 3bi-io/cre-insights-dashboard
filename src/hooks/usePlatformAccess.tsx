import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { OrganizationPlatformsService } from '@/features/organizations/services/organizationPlatformsService';
import {
  OrganizationPlatformAccess,
  PlatformUpdatePayload,
} from '@/features/organizations/types/platforms.types';
import { getAllPlatforms } from '@/features/organizations/config/organizationPlatforms.config';

/**
 * Hook for managing organization platform access (admin only)
 * Provides CRUD operations for platform management
 */
export const usePlatformAccess = (organizationId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch organization platforms
  const platformsQuery = useQuery({
    queryKey: ['organization-platform-access', organizationId],
    queryFn: async (): Promise<OrganizationPlatformAccess[]> => {
      if (!organizationId) return [];

      try {
        return await OrganizationPlatformsService.fetchOrganizationPlatforms(
          organizationId
        );
      } catch (error: any) {
        console.error('Failed to fetch organization platforms:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load platforms',
          variant: 'destructive',
        });
        throw error;
      }
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Update platforms mutation
  const updatePlatformsMutation = useMutation({
    mutationFn: async ({
      orgId,
      platforms,
    }: {
      orgId: string;
      platforms: PlatformUpdatePayload;
    }) => {
      await OrganizationPlatformsService.updateOrganizationPlatforms(
        orgId,
        platforms
      );
    },
    onSuccess: () => {
      // Invalidate all platform-related queries
      queryClient.invalidateQueries({
        queryKey: ['organization-platform-access'],
      });
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      
      toast({
        title: 'Success',
        description: 'Organization platforms have been successfully updated.',
      });
    },
    onError: (error: any) => {
      console.error('Failed to update platforms:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update platforms',
        variant: 'destructive',
      });
    },
  });

  // Memoize available platforms to prevent infinite re-renders
  const availablePlatforms = useMemo(() => getAllPlatforms(), []);

  // Check if a platform is enabled (utility function) - memoized to prevent infinite loops in useEffect
  const checkPlatformAccess = useCallback(async (platformName: string): Promise<boolean> => {
    // Default to true if no organization - aligns with DB default behavior
    if (!organizationId) return true;
    
    const platformsMap = await OrganizationPlatformsService.fetchOrganizationPlatformsMap(organizationId);
    return platformsMap[platformName as any] ?? true; // Default to true if not found
  }, [organizationId]);

  return {
    // Data
    platforms: platformsQuery.data || [],
    availablePlatforms,
    
    // State
    isLoading: platformsQuery.isLoading,
    isError: platformsQuery.isError,
    error: platformsQuery.error,
    
    // Mutations
    updatePlatforms: updatePlatformsMutation.mutateAsync,
    isUpdating: updatePlatformsMutation.isPending,
    
    // Utilities
    checkPlatformAccess,
    refetch: platformsQuery.refetch,
  };
};