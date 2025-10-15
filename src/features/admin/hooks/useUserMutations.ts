import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { UserManagementService } from '../services';
import { UpdateUserPayload, AssignRolePayload } from '../types';

/**
 * Hook for user management mutations
 */
export const useUserMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateUserMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateUserPayload }) =>
      UserManagementService.updateUser(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    },
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: ({ userId, enabled }: { userId: string; enabled: boolean }) =>
      UserManagementService.updateUserStatus(userId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast({
        title: 'Success',
        description: 'User status updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user status',
        variant: 'destructive',
      });
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: (payload: AssignRolePayload) =>
      UserManagementService.assignRole(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: 'Role assigned successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign role',
        variant: 'destructive',
      });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: any }) =>
      UserManagementService.removeRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: 'Role removed successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove role',
        variant: 'destructive',
      });
    },
  });

  return {
    updateUser: updateUserMutation.mutate,
    updateUserStatus: updateUserStatusMutation.mutate,
    assignRole: assignRoleMutation.mutate,
    removeRole: removeRoleMutation.mutate,
    isUpdating: updateUserMutation.isPending,
  };
};
