import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryKeys';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  enabled: boolean;
  created_at: string;
  organization_id: string | null;
  organization_name?: string;
  role: string;
}

export function useSuperAdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users with their roles and organizations
  const usersQuery = useQuery({
    queryKey: queryKeys.admin.superAdminUsers(),
    queryFn: async (): Promise<UserWithRole[]> => {
      // First get all profiles with organizations
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          enabled,
          created_at,
          organization_id,
          organizations(name)
        `)
        .order('created_at', { ascending: false });

      if (profilesError) {
        throw new Error(profilesError.message);
      }

      // Then get all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        throw new Error(rolesError.message);
      }

      // Combine the data
      return profilesData?.map(user => {
        const userRole = rolesData?.find(role => role.user_id === user.id);
        return {
          id: user.id,
          email: user.email || '',
          full_name: user.full_name,
          enabled: user.enabled,
          created_at: user.created_at,
          organization_id: user.organization_id,
          organization_name: (user.organizations as any)?.name || 'No Organization',
          role: userRole?.role || 'user'
        };
      }) || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Update user status mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, enabled }: { userId: string; enabled: boolean }) => {
      const { error } = await supabase.rpc('update_user_status', {
        _user_id: userId,
        _enabled: enabled
      });

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: (_, { enabled }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.superAdminUsers() });
      toast({
        title: "User status updated",
        description: `User has been ${enabled ? 'enabled' : 'disabled'} successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating user status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    users: usersQuery.data,
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    updateUserStatus: updateUserStatusMutation.mutate,
    isUpdating: updateUserStatusMutation.isPending,
  };
}