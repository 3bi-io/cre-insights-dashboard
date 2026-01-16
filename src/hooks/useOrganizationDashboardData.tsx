import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { queryKeys } from '@/lib/queryKeys';

interface OrganizationMetrics {
  activeUsers: number;
  activeJobs: number;
  totalApplications: number;
  monthlySpend: number;
  // Comparative data
  previousMonthSpend: number;
  previousMonthApplications: number;
  previousMonthJobs: number;
  spendTrend: { percentage: number; direction: 'up' | 'down' | 'stable' };
  applicationsTrend: { percentage: number; direction: 'up' | 'down' | 'stable' };
  jobsTrend: { percentage: number; direction: 'up' | 'down' | 'stable' };
  costPerApplication: number;
  averageApplicationsPerJob: number;
  // Performance indicators
  weeklyGrowthRate: number;
  costEfficiencyScore: number;
}

export const useOrganizationDashboardData = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: queryKeys.orgDashboard.metrics(organization?.id || ''),
    queryFn: async (): Promise<OrganizationMetrics> => {
      if (!organization?.id) {
        return {
          activeUsers: 0,
          activeJobs: 0,
          totalApplications: 0,
          monthlySpend: 0,
          previousMonthSpend: 0,
          previousMonthApplications: 0,
          previousMonthJobs: 0,
          spendTrend: { percentage: 0, direction: 'stable' as const },
          applicationsTrend: { percentage: 0, direction: 'stable' as const },
          jobsTrend: { percentage: 0, direction: 'stable' as const },
          costPerApplication: 0,
          averageApplicationsPerJob: 0,
          weeklyGrowthRate: 0,
          costEfficiencyScore: 0,
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

      // Date calculations
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get current month's spend
      const { data: metaSpendData } = await supabase
        .from('meta_daily_spend')
        .select('spend')
        .eq('organization_id', organization.id)
        .gte('date_start', startOfMonth.toISOString().split('T')[0]);

      const metaSpend = metaSpendData?.reduce((sum, record) => sum + (Number(record.spend) || 0), 0) || 0;

      // Get previous month's spend for comparison
      const { data: prevMetaSpendData } = await supabase
        .from('meta_daily_spend')
        .select('spend')
        .eq('organization_id', organization.id)
        .gte('date_start', startOfPreviousMonth.toISOString().split('T')[0])
        .lte('date_start', endOfPreviousMonth.toISOString().split('T')[0]);

      const prevMetaSpend = prevMetaSpendData?.reduce((sum, record) => sum + (Number(record.spend) || 0), 0) || 0;

      // Get daily spend data
      let dailySpendTotal = 0;
      let prevDailySpendTotal = 0;

      if (orgJobs && orgJobs.length > 0) {
        const { data: dailySpendData } = await supabase
          .from('daily_spend')
          .select('amount')
          .in('job_listing_id', orgJobs.map(j => j.id))
          .gte('date', startOfMonth.toISOString().split('T')[0]);

        dailySpendTotal = dailySpendData?.reduce((sum, record) => sum + (Number(record.amount) || 0), 0) || 0;

        // Previous month daily spend
        const { data: prevDailySpendData } = await supabase
          .from('daily_spend')
          .select('amount')
          .in('job_listing_id', orgJobs.map(j => j.id))
          .gte('date', startOfPreviousMonth.toISOString().split('T')[0])
          .lte('date', endOfPreviousMonth.toISOString().split('T')[0]);

        prevDailySpendTotal = prevDailySpendData?.reduce((sum, record) => sum + (Number(record.amount) || 0), 0) || 0;
      }

      const monthlySpend = metaSpend + dailySpendTotal;
      const previousMonthSpend = prevMetaSpend + prevDailySpendTotal;

      // Get previous month's applications for comparison
      const { count: prevApplicationsCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .in('job_listing_id', orgJobs?.map(j => j.id) || [])
        .gte('applied_at', startOfPreviousMonth.toISOString())
        .lte('applied_at', endOfPreviousMonth.toISOString());

      const previousMonthApplications = prevApplicationsCount || 0;

      // Get previous month's active jobs
      const { count: prevActiveJobs } = await supabase
        .from('job_listings')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .eq('status', 'active')
        .lte('created_at', endOfPreviousMonth.toISOString());

      const previousMonthJobs = prevActiveJobs || 0;

      // Calculate trends
      const calculateTrend = (current: number, previous: number): { percentage: number; direction: 'up' | 'down' | 'stable' } => {
        if (previous === 0) return { percentage: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'stable' };
        const percentage = Math.abs(((current - previous) / previous) * 100);
        const direction = current > previous ? 'up' : current < previous ? 'down' : 'stable';
        return { percentage: Math.round(percentage), direction };
      };

      const spendTrend = calculateTrend(monthlySpend, previousMonthSpend);
      const applicationsTrend = calculateTrend(totalApplications, previousMonthApplications);
      const jobsTrend = calculateTrend(activeJobs || 0, previousMonthJobs);

      // Calculate performance metrics
      const costPerApplication = totalApplications > 0 ? monthlySpend / totalApplications : 0;
      const averageApplicationsPerJob = (activeJobs || 0) > 0 ? totalApplications / (activeJobs || 1) : 0;

      // Weekly growth rate (simplified calculation)
      const { count: weeklyApplications } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .in('job_listing_id', orgJobs?.map(j => j.id) || [])
        .gte('applied_at', startOfWeek.toISOString());

      const weeklyGrowthRate = previousMonthApplications > 0 
        ? Math.round(((weeklyApplications || 0) * 4 - previousMonthApplications) / previousMonthApplications * 100)
        : 0;

      // Cost efficiency score (lower cost per application = higher score)
      const industryAvgCostPerApp = 50; // Industry benchmark
      const costEfficiencyScore = costPerApplication > 0 
        ? Math.max(0, Math.round((1 - (costPerApplication / industryAvgCostPerApp)) * 100))
        : 0;

      return {
        activeUsers: activeUsers || 0,
        activeJobs: activeJobs || 0,
        totalApplications,
        monthlySpend,
        previousMonthSpend,
        previousMonthApplications,
        previousMonthJobs,
        spendTrend,
        applicationsTrend,
        jobsTrend,
        costPerApplication,
        averageApplicationsPerJob,
        weeklyGrowthRate,
        costEfficiencyScore,
      };
    },
    enabled: !!organization?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
