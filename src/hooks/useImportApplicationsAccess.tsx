import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook to check if the current user has access to Import Applications
 * Super admins always have access
 * Other users need explicit platform access enabled for their organization
 */
export const useImportApplicationsAccess = () => {
  const { userRole, organization } = useAuth();

  const { data: hasImportApplicationsAccess = false } = useQuery({
    queryKey: queryKeys.access.importApplications(organization?.id),
    queryFn: async () => {
      // Super admins always have access
      if (userRole === 'super_admin') {
        return true;
      }

      // Regular admins need to check platform access
      if (userRole === 'admin' && organization?.id) {
        try {
          const { data, error } = await supabase.rpc('get_user_platform_access', {
            _platform_name: 'import_applications'
          });

          if (error) {
            logger.error('Error checking Import Applications access', error);
            return false;
          }

          return data || false;
        } catch (error) {
          logger.error('Error checking Import Applications access', error);
          return false;
        }
      }

      return false;
    },
    enabled: !!organization?.id || userRole === 'super_admin',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { hasImportApplicationsAccess };
};
