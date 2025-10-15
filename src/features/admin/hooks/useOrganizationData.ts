import { useQuery } from '@tanstack/react-query';
import { OrganizationService } from '../services';

/**
 * Hook to fetch all organizations
 */
export const useOrganizations = () => {
  const {
    data: organizations,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['organizations'],
    queryFn: OrganizationService.fetchOrganizations,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    organizations,
    isLoading,
    error,
    refetch
  };
};

/**
 * Hook to fetch a single organization
 */
export const useOrganization = (id: string) => {
  const {
    data: organization,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['organization', id],
    queryFn: () => OrganizationService.fetchOrganization(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  return {
    organization,
    isLoading,
    error,
    refetch
  };
};

/**
 * Hook to fetch organization with stats
 */
export const useOrganizationWithStats = (id: string) => {
  const {
    data: organization,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['organization-stats', id],
    queryFn: () => OrganizationService.fetchOrganizationWithStats(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    organization,
    isLoading,
    error,
    refetch
  };
};

/**
 * Hook to fetch organization platform access
 */
export const useOrganizationPlatformAccess = (organizationId: string) => {
  const {
    data: platformAccess,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['organization-platform-access', organizationId],
    queryFn: () => OrganizationService.fetchOrganizationPlatformAccess(organizationId),
    enabled: !!organizationId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  return {
    platformAccess,
    isLoading,
    error,
    refetch
  };
};
