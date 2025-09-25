import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
      console.log('Fetching routes for organization:', organization?.id, 'role:', userRole);
      
      let query = supabase
        .from('job_listings')
        .select('city, state, dest_city, dest_state, organization_id')
        .not('city', 'is', null)
        .not('state', 'is', null)
        .not('dest_city', 'is', null)
        .not('dest_state', 'is', null);

      // Apply organization filter for non-super-admins
      if (userRole !== 'super_admin' && organization?.id) {
        query = query.eq('organization_id', organization.id);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching routes data:', error);
        throw error;
      }

      console.log('Raw route data fetched:', data?.length || 0);

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
      console.log('Processed routes:', routesArray.length);
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