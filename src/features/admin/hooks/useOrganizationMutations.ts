import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { OrganizationService } from '../services';
import { OrganizationFormData, OrganizationUpdatePayload } from '../types';

/**
 * Hook for organization mutations (create, update, delete)
 */
export const useOrganizationMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: OrganizationFormData) => OrganizationService.createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-organizations-stats'] });
      toast({
        title: 'Success',
        description: 'Organization created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create organization',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: OrganizationUpdatePayload }) =>
      OrganizationService.updateOrganization(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      queryClient.invalidateQueries({ queryKey: ['admin-organizations-stats'] });
      toast({
        title: 'Success',
        description: 'Organization updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update organization',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => OrganizationService.deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-organizations-stats'] });
      toast({
        title: 'Success',
        description: 'Organization deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete organization',
        variant: 'destructive',
      });
    },
  });

  const updateFeaturesMutation = useMutation({
    mutationFn: ({ organizationId, features }: { organizationId: string; features: Record<string, any> }) =>
      OrganizationService.updateOrganizationFeatures(organizationId, features),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast({
        title: 'Success',
        description: 'Organization features updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update organization features',
        variant: 'destructive',
      });
    },
  });

  const updatePlatformAccessMutation = useMutation({
    mutationFn: ({ organizationId, platformName, enabled }: { organizationId: string; platformName: string; enabled: boolean }) =>
      OrganizationService.setOrganizationPlatformAccess(organizationId, platformName, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-platform-access'] });
      toast({
        title: 'Success',
        description: 'Platform access updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update platform access',
        variant: 'destructive',
      });
    },
  });

  return {
    createOrganization: createMutation.mutate,
    updateOrganization: updateMutation.mutate,
    deleteOrganization: deleteMutation.mutate,
    updateFeatures: updateFeaturesMutation.mutate,
    updatePlatformAccess: updatePlatformAccessMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
