import { supabase } from '@/integrations/supabase/client';
import { AdminDashboardMetrics, OrganizationStats, UserActivity } from '../types';
import { logger } from '@/lib/logger';

/**
 * Service for fetching admin dashboard metrics and statistics
 */
export class AdminMetricsService {
  /**
   * Fetches admin dashboard metrics
   */
  static async fetchDashboardMetrics(): Promise<AdminDashboardMetrics> {
    logger.debug('AdminMetricsService: Fetching dashboard metrics');
    
    // Get total organizations
    const { count: totalOrganizations } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get total admins
    const { count: totalAdmins } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .in('role', ['admin', 'super_admin']);

    // Get total applications
    const { count: totalApplications } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true });

    // Get total active jobs
    const { count: totalJobs } = await supabase
      .from('job_listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get total spend from Meta daily spend (current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: metaSpendData } = await supabase
      .from('meta_daily_spend')
      .select('spend')
      .gte('date_start', startOfMonth.toISOString().split('T')[0]);

    const monthlySpend = metaSpendData?.reduce((sum, record) => sum + (Number(record.spend) || 0), 0) || 0;

    // Get daily spend data as well
    const { data: dailySpendData } = await supabase
      .from('daily_spend')
      .select('amount')
      .gte('date', startOfMonth.toISOString().split('T')[0]);

    const dailySpendTotal = dailySpendData?.reduce((sum, record) => sum + (Number(record.amount) || 0), 0) || 0;
    
    const totalRevenue = monthlySpend + dailySpendTotal;

    // Get recent signups (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { count: recentSignups } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    return {
      totalOrganizations: totalOrganizations || 0,
      totalUsers: totalUsers || 0,
      totalAdmins: totalAdmins || 0,
      totalApplications: totalApplications || 0,
      totalJobs: totalJobs || 0,
      totalRevenue,
      monthlySpend: totalRevenue,
      recentSignups: recentSignups || 0,
    };
  }

  /**
   * Fetches organizations with statistics
   */
  static async fetchOrganizationsWithStats(): Promise<OrganizationStats[]> {
    logger.debug('AdminMetricsService: Fetching organizations with stats');
    
    // Get organizations with counts
    const { data: organizations } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        created_at,
        subscription_status
      `);

    if (!organizations) return [];

    // Get data for each organization
    const orgData = await Promise.all(
      organizations.map(async (org) => {
        // Get user count for this org
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id);

        // Get job count for this org
        const { count: jobCount } = await supabase
          .from('job_listings')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('status', 'active');

        // Get application count for this org
        const { data: orgJobs } = await supabase
          .from('job_listings')
          .select('id')
          .eq('organization_id', org.id);

        let applicationCount = 0;
        if (orgJobs && orgJobs.length > 0) {
          const { count } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .in('job_listing_id', orgJobs.map(j => j.id));
          applicationCount = count || 0;
        }

        // Get monthly spend for this org
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: spendData } = await supabase
          .from('meta_daily_spend')
          .select('spend')
          .eq('organization_id', org.id)
          .gte('date_start', startOfMonth.toISOString().split('T')[0]);

        const monthlySpend = spendData?.reduce((sum, record) => sum + (Number(record.spend) || 0), 0) || 0;

        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          created_at: org.created_at,
          subscription_status: org.subscription_status,
          userCount: userCount || 0,
          jobCount: jobCount || 0,
          applicationCount,
          monthlySpend,
        };
      })
    );

    return orgData;
  }

  /**
   * Fetches recent user activity
   */
  static async fetchUserActivity(): Promise<UserActivity[]> {
    logger.debug('AdminMetricsService: Fetching user activity');
    
    // Get recent user activity with organization and role info
    const { data: profiles } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        created_at,
        organizations (
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!profiles) return [];

    // Get roles for these users
    const userIds = profiles.map(p => p.id);
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds);

    return profiles.map(profile => {
      const userRole = roles?.find(r => r.user_id === profile.id);
      return {
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name || profile.email || '',
        organization_name: (profile.organizations as any)?.name || 'Unknown',
        role: userRole?.role || 'user',
        last_sign_in_at: profile.created_at,
      };
    });
  }
}
