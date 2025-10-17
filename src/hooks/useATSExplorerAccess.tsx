import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Hook to check if the current user has access to ATS Explorer
 * Super admins always have access
 * Other users need explicit platform access enabled for their organization
 */
export const useATSExplorerAccess = () => {
  const { userRole, organization } = useAuth();

  const { data: hasAccess, isLoading } = useQuery({
    queryKey: ['ats-explorer-access', organization?.id],
    queryFn: async () => {
      // Super admins always have access
      if (userRole === 'super_admin') {
        return true;
      }

      // Check platform access for organization
      if (!organization?.id) {
        return false;
      }

      try {
        const { data, error } = await supabase.rpc('get_user_platform_access', {
          _platform_name: 'ats_explorer'
        });

        if (error) {
          console.error('Error checking ATS Explorer access:', error);
          return false;
        }

        return data || false;
      } catch (error) {
        console.error('Error checking ATS Explorer access:', error);
        return false;
      }
    },
    enabled: !!organization?.id,
  });

  return {
    hasATSExplorerAccess: hasAccess ?? false,
    isLoading,
  };
};
