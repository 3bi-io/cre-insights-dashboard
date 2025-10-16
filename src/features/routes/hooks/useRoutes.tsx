import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/services/loggerService';

interface Route {
  origin_city: string;
  origin_state: string;
  dest_city: string;
  dest_state: string;
  job_count: number;
  organization_id?: string;
}

export const useRoutes = () => {
  const { userRole, organization } = useAuth();
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  const {
    data: routes,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['routes', organization?.id, userRole],
    queryFn: async (): Promise<Route[]> => {
      logger.debug('Fetching routes', { organizationId: organization?.id, userRole }, 'Routes');
      
      // Get demo organization ID to exclude
      const { data: demoOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', 'acme')
        .single();
      
      let query = supabase
        .from('job_listings')
        .select('city, state, dest_city, dest_state, organization_id')
        .not('city', 'is', null)
        .not('state', 'is', null)
        .not('dest_city', 'is', null)
        .not('dest_state', 'is', null);

      // Exclude demo organization routes
      if (demoOrg?.id) {
        query = query.neq('organization_id', demoOrg.id);
      }

      // Apply organization filter for non-super-admins
      if (userRole !== 'super_admin' && organization?.id) {
        query = query.eq('organization_id', organization.id);
      }

      const { data, error } = await query;
      
      if (error) {
        logger.error('Error fetching routes data', error, 'Routes');
        throw error;
      }

      logger.debug('Raw route data fetched', { count: data?.length || 0 }, 'Routes');

      // Group by unique origin-destination pairs and count occurrences
      const routeMap = new Map<string, Route>();
      
      data?.forEach(job => {
        const key = `${job.city}-${job.state}-${job.dest_city}-${job.dest_state}`;
        if (routeMap.has(key)) {
          routeMap.get(key)!.job_count += 1;
        } else {
          routeMap.set(key, {
            origin_city: job.city,
            origin_state: job.state,
            dest_city: job.dest_city,
            dest_state: job.dest_state,
            job_count: 1,
            organization_id: job.organization_id
          });
        }
      });

      const routesArray = Array.from(routeMap.values()).sort((a, b) => b.job_count - a.job_count);
      logger.debug('Processed routes', { count: routesArray.length }, 'Routes');
      return routesArray;
    },
    enabled: !!organization || userRole === 'super_admin',
    staleTime: 15 * 60 * 1000, // 15 minutes - routes don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    routes: routes || [],
    isLoading,
    error,
    refetch,
    isAdmin,
    organization,
    userRole,
  };
};