import { useQuery } from '@tanstack/react-query';
import { UserManagementService } from '../services';

/**
 * Hook to fetch all users
 */
export const useUsers = () => {
  const {
    data: users,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['users'],
    queryFn: UserManagementService.fetchUsers,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    users,
    isLoading,
    error,
    refetch
  };
};

/**
 * Hook to fetch users for a specific organization
 */
export const useOrganizationUsers = (organizationId: string) => {
  const {
    data: users,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['organization-users', organizationId],
    queryFn: () => UserManagementService.fetchOrganizationUsers(organizationId),
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  });

  return {
    users,
    isLoading,
    error,
    refetch
  };
};

/**
 * Hook to fetch a single user
 */
export const useUser = (id: string) => {
  const {
    data: user,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['user', id],
    queryFn: () => UserManagementService.fetchUser(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  return {
    user,
    isLoading,
    error,
    refetch
  };
};

/**
 * Hook to fetch user roles
 */
export const useUserRoles = (userId: string) => {
  const {
    data: roles,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['user-roles', userId],
    queryFn: () => UserManagementService.fetchUserRoles(userId),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  return {
    roles,
    isLoading,
    error,
    refetch
  };
};
