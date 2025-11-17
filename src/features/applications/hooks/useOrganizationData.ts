import { supabase } from '@/integrations/supabase/client';
import type { Organization } from '@/types/common.types';
import { createQueryHook } from '@/hooks/factories';

/**
 * Hook for fetching organizations (super admin only)
 * Refactored to use generic query factory
 */
const useOrganizationQuery = createQueryHook<Organization[]>({
  queryKey: ['organizations'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, slug, created_at, updated_at')
      .order('name');
    
    if (error) throw error;
    return data as Organization[];
  },
  staleTime: 5 * 60 * 1000, // 5 minutes
});

export const useOrganizationData = (isSuperAdmin: boolean) => {
  const { data: organizations = [], isLoading: loading } = useOrganizationQuery({
    enabled: isSuperAdmin,
  });

  return { organizations, loading };
};
