import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';

interface UserDashboardMetrics {
  totalApplications: number;
  activeJobs: number;
  recentActivity: number;
  applicationsByStatus: {
    pending: number;
    screening: number;
    interviewing: number;
    hired: number;
    rejected: number;
  };
  recentApplications: Array<{
    id: string;
    name: string;
    appliedAt: string;
    status: string;
    jobTitle: string;
  }>;
}

export const useUserDashboardData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.admin.userDashboard(user?.id),
    queryFn: async (): Promise<UserDashboardMetrics> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // 1. Get user's recruiter profile if exists
      const { data: recruiterProfile } = await supabase
        .from('recruiters')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // 2. Fetch applications (user's jobs + assigned as recruiter)
      let applicationsQuery = supabase
        .from('applications')
        .select(`
          id,
          status,
          applied_at,
          first_name,
          last_name,
          job_listings!inner(
            id,
            user_id,
            title,
            organization_id
          )
        `, { count: 'exact' })
        .order('applied_at', { ascending: false });

      // Build query based on whether user is a recruiter
      if (recruiterProfile?.id) {
        applicationsQuery = applicationsQuery.or(
          `job_listings.user_id.eq.${user.id},recruiter_id.eq.${recruiterProfile.id}`
        );
      } else {
        applicationsQuery = applicationsQuery.eq('job_listings.user_id', user.id);
      }

      const { data: applications, count: totalApps } = await applicationsQuery;

      // 3. Fetch user's active jobs
      const { count: activeJobsCount } = await supabase
        .from('job_listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active');

      // 4. Calculate recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentActivity = applications?.filter(app => 
        new Date(app.applied_at) >= sevenDaysAgo
      ).length || 0;

      // 5. Group applications by status
      const statusBreakdown = applications?.reduce((acc, app) => {
        const status = app.status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // 6. Format recent applications (top 5)
      const recentApplications = (applications || []).slice(0, 5).map(app => ({
        id: app.id,
        name: `${app.first_name || ''} ${app.last_name || ''}`.trim() || 'Unknown',
        appliedAt: app.applied_at,
        status: app.status || 'pending',
        jobTitle: (app.job_listings as any)?.title || 'Unknown Position'
      }));

      return {
        totalApplications: totalApps || 0,
        activeJobs: activeJobsCount || 0,
        recentActivity,
        applicationsByStatus: {
          pending: statusBreakdown?.pending || 0,
          screening: statusBreakdown?.screening || 0,
          interviewing: statusBreakdown?.interviewing || 0,
          hired: statusBreakdown?.hired || 0,
          rejected: statusBreakdown?.rejected || 0,
        },
        recentApplications
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
