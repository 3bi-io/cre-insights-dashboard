import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { OrganizationService } from '../services';
import { OrganizationFormData, OrganizationUpdatePayload } from '../types';
import { createMutationHook } from '@/hooks/factories';

/**
 * Hook for organization mutations (create, update, delete)
 * Refactored to use generic mutation factory
 */
export const useOrganizationMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateKeys = ['organizations', 'organization', 'admin-organizations-stats'];

  const createMutation = createMutationHook<unknown, OrganizationFormData>({
    mutationFn: OrganizationService.createOrganization,
    invalidateQueries: invalidateKeys,
    successMessage: 'Organization created successfully',
    errorMessage: 'Failed to create organization',
  })();

  const updateMutation = createMutationHook<unknown, { id: string; updates: OrganizationUpdatePayload }>({
    mutationFn: ({ id, updates }) => OrganizationService.updateOrganization(id, updates),
    invalidateQueries: invalidateKeys,
    successMessage: 'Organization updated successfully',
    errorMessage: 'Failed to update organization',
  })();

  const deleteMutation = createMutationHook<void, string>({
    mutationFn: OrganizationService.deleteOrganization,
    invalidateQueries: invalidateKeys,
    successMessage: 'Organization deleted successfully',
    errorMessage: 'Failed to delete organization',
  })();

  const updateFeaturesMutation = createMutationHook<void, { organizationId: string; features: Record<string, unknown> }>({
    mutationFn: ({ organizationId, features }) =>
      OrganizationService.updateOrganizationFeatures(organizationId, features),
    invalidateQueries: ['organization'],
    successMessage: 'Organization features updated successfully',
    errorMessage: 'Failed to update organization features',
  })();

  const updatePlatformAccessMutation = createMutationHook<void, { organizationId: string; platformName: string; enabled: boolean }>({
    mutationFn: ({ organizationId, platformName, enabled }) =>
      OrganizationService.setOrganizationPlatformAccess(organizationId, platformName, enabled),
    invalidateQueries: ['organization-platform-access'],
    successMessage: 'Platform access updated successfully',
    errorMessage: 'Failed to update platform access',
  })();

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
