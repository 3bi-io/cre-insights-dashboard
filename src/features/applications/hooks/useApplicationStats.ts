import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getApplicantCategory } from '../utils/applicationFormatters';

interface ApplicationStatsFilters {
  organizationId?: string;
}

interface ApplicationStats {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}

interface ApplicationRow {
  status: string | null;
  cdl: string | null;
  age: string | null;
  exp: string | null;
  months: string | null;
  job_listings?: { organization_id: string | null } | null;
}

/**
 * Hook to fetch aggregate statistics for ALL applications in the database
 * (not just the paginated subset). Used to display accurate totals in the dashboard.
 */
export const useApplicationStats = (filters: ApplicationStatsFilters = {}) => {
  return useQuery({
    queryKey: ['application-stats', filters],
    queryFn: async (): Promise<ApplicationStats> => {
      // Fetch minimal fields needed for aggregation - no pagination limit
      let query = supabase
        .from('applications')
        .select(`
          status,
          cdl,
          age,
          exp,
          months,
          job_listings(organization_id)
        `);

      // Apply org filter if provided
      if (filters.organizationId && filters.organizationId !== 'all') {
        query = query.eq('job_listings.organization_id', filters.organizationId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const applications = (data || []) as unknown as ApplicationRow[];

      // Calculate status counts
      const byStatus: Record<string, number> = {};
      applications.forEach(app => {
        const status = app.status || 'pending';
        byStatus[status] = (byStatus[status] || 0) + 1;
      });

      // Calculate category counts using the same logic as the formatters
      const byCategory: Record<string, number> = {};
      applications.forEach(app => {
        const category = getApplicantCategory(app as any);
        byCategory[category.code] = (byCategory[category.code] || 0) + 1;
      });

      return {
        total: applications.length,
        byStatus,
        byCategory,
      };
    },
    staleTime: 30000, // 30 seconds - avoid excessive refetching
  });
};
