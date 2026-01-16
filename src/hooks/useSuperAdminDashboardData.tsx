import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

interface SuperAdminDashboardMetrics {
  totalOrganizations: number;
  totalUsers: number;
  totalApplications: number;
  systemHealth: number;
  organizationGrowth: {
    current: number;
    previous: number;
    percentageChange: number;
  };
  userGrowth: {
    current: number;
    percentageChange: number;
  };
}

export const useSuperAdminDashboardData = () => {
  return useQuery({
    queryKey: queryKeys.admin.superAdminDashboard(),
    queryFn: async (): Promise<SuperAdminDashboardMetrics> => {
      // 1. Organizations count
      const { count: orgsCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      // 2. Active users count (users with organization)
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('organization_id', 'is', null);

      // 3. Total applications
      const { count: totalApps } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true });

      // 4. Calculate growth (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const sixtyDaysAgoISO = sixtyDaysAgo.toISOString();

      // Recent organizations (last 30 days)
      const { count: recentOrgsCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgoISO);

      // Previous month organizations (30-60 days ago)
      const { count: previousOrgsCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sixtyDaysAgoISO)
        .lt('created_at', thirtyDaysAgoISO);

      // Recent users (last 30 days)
      const { count: recentUsersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgoISO)
        .not('organization_id', 'is', null);

      // Previous month users
      const { count: previousUsersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sixtyDaysAgoISO)
        .lt('created_at', thirtyDaysAgoISO)
        .not('organization_id', 'is', null);

      // Calculate percentage changes
      const orgPercentageChange = previousOrgsCount && previousOrgsCount > 0
        ? ((recentOrgsCount || 0) - previousOrgsCount) / previousOrgsCount * 100
        : 0;

      const userPercentageChange = previousUsersCount && previousUsersCount > 0
        ? ((recentUsersCount || 0) - previousUsersCount) / previousUsersCount * 100
        : 0;

      return {
        totalOrganizations: orgsCount || 0,
        totalUsers: usersCount || 0,
        totalApplications: totalApps || 0,
        systemHealth: 99.9, // Can be calculated based on uptime/errors in future
        organizationGrowth: {
          current: recentOrgsCount || 0,
          previous: previousOrgsCount || 0,
          percentageChange: orgPercentageChange
        },
        userGrowth: {
          current: recentUsersCount || 0,
          percentageChange: userPercentageChange
        }
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
