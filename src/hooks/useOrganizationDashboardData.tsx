import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface OrganizationMetrics {
  activeUsers: number;
  activeJobs: number;
  totalApplications: number;
  monthlySpend: number;
}

export const useOrganizationDashboardData = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['organization-dashboard-metrics', organization?.id],
    queryFn: async (): Promise<OrganizationMetrics> => {
      if (!organization?.id) {
        return {
          activeUsers: 0,
          activeJobs: 0,
          totalApplications: 0,
          monthlySpend: 0,
        };
      }

      // Get active users count for the organization
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id);

      // Get active jobs count for the organization
      const { count: activeJobs } = await supabase
        .from('job_listings')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .eq('status', 'active');

      // Get total applications for organization's jobs
      const { data: orgJobs } = await supabase
        .from('job_listings')
        .select('id')
        .eq('organization_id', organization.id);

      let totalApplications = 0;
      if (orgJobs && orgJobs.length > 0) {
        const { count } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .in('job_listing_id', orgJobs.map(j => j.id));
        totalApplications = count || 0;
      }

      // Get monthly spend for the organization
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: metaSpendData } = await supabase
        .from('meta_daily_spend')
        .select('spend')
        .eq('organization_id', organization.id)
        .gte('date_start', startOfMonth.toISOString().split('T')[0]);

      const metaSpend = metaSpendData?.reduce((sum, record) => sum + (Number(record.spend) || 0), 0) || 0;

      // Get daily spend data as well for organization jobs
      if (orgJobs && orgJobs.length > 0) {
        const { data: dailySpendData } = await supabase
          .from('daily_spend')
          .select('amount')
          .in('job_listing_id', orgJobs.map(j => j.id))
          .gte('date', startOfMonth.toISOString().split('T')[0]);

        const dailySpendTotal = dailySpendData?.reduce((sum, record) => sum + (Number(record.amount) || 0), 0) || 0;
        
        return {
          activeUsers: activeUsers || 0,
          activeJobs: activeJobs || 0,
          totalApplications,
          monthlySpend: metaSpend + dailySpendTotal,
        };
      }

      return {
        activeUsers: activeUsers || 0,
        activeJobs: activeJobs || 0,
        totalApplications,
        monthlySpend: metaSpend,
      };
    },
    enabled: !!organization?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};