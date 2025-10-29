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
  
  const isSuperAdmin = userRole === 'super_admin';

  const { data: hasAccess, isLoading } = useQuery({
    queryKey: ['ats-explorer-access', organization?.id],
    queryFn: async () => {
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
    // Don't run query for super admins
    enabled: !isSuperAdmin && !!organization?.id,
  });

  return {
    // Super admins always have access, otherwise check the query result
    hasATSExplorerAccess: isSuperAdmin || (hasAccess ?? false),
    isLoading: isSuperAdmin ? false : isLoading,
  };
};
