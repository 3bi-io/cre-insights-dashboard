import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePlatformAccess = (organizationId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if current user has access to a specific platform
  const { data: userPlatformAccess, isLoading: isCheckingAccess } = useQuery({
    queryKey: ['user-platform-access'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_platform_access', {
        _platform_name: 'all'
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !organizationId, // Only check user access when not viewing specific org
  });

  // Get platform access for a specific organization (Super Admin only)
  const { data: organizationPlatformAccess, isLoading: isLoadingOrgAccess } = useQuery({
    queryKey: ['organization-platform-access', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase.rpc('get_organization_platform_access', {
        _org_id: organizationId
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  // Set platform access for an organization (Super Admin only)
  const setPlatformAccessMutation = useMutation({
    mutationFn: async ({ 
      orgId, 
      platformName, 
      enabled 
    }: { 
      orgId: string; 
      platformName: string; 
      enabled: boolean; 
    }) => {
      const { error } = await supabase.rpc('set_organization_platform_access', {
        _org_id: orgId,
        _platform_name: platformName,
        _enabled: enabled
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-platform-access'] });
      toast({
        title: "Platform Access Updated",
        description: "Successfully updated platform access for organization",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update platform access",
        variant: "destructive",
      });
    },
  });

  // Check if user has access to specific platform
  const checkPlatformAccess = async (platformName: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('get_user_platform_access', {
        _platform_name: platformName
      });
      
      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking platform access:', error);
      return false;
    }
  };

  const setPlatformAccess = (orgId: string, platformName: string, enabled: boolean) => {
    setPlatformAccessMutation.mutate({ orgId, platformName, enabled });
  };

  return {
    userPlatformAccess,
    organizationPlatformAccess,
    isCheckingAccess,
    isLoadingOrgAccess,
    checkPlatformAccess,
    setPlatformAccess,
    isUpdating: setPlatformAccessMutation.isPending,
  };
};