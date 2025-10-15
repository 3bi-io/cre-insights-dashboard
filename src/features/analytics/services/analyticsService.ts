import { supabase } from '@/integrations/supabase/client';
import type { 
  SpendTrendData, 
  PlatformPerformanceData, 
  MonthlyBudgetData,
  JobVolumeData,
  CategoryData,
  AnalyticsDashboardMetrics,
  DateRange
} from '../types';

export const analyticsService = {
  /**
   * Fetch spend trend data for charts
   */
  async getSpendTrendData(organizationId?: string): Promise<SpendTrendData[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let query = supabase
      .from('daily_spend')
      .select(`
        date,
        amount,
        job_listings!inner(organization_id)
      `)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (organizationId) {
      query = query.eq('job_listings.organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Group by date and aggregate
    const grouped = (data || []).reduce((acc: Record<string, { spend: number; applications: number }>, item: any) => {
      const date = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!acc[date]) {
        acc[date] = { spend: 0, applications: 0 };
      }
      acc[date].spend += Number(item.amount || 0);
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, values]) => ({
      date,
      spend: values.spend,
      applications: values.applications
    }));
  },

  /**
   * Fetch platform performance data
   */
  async getPlatformPerformanceData(organizationId?: string): Promise<PlatformPerformanceData[]> {
    let query = supabase
      .from('job_listings')
      .select(`
        id,
        organization_id,
        applications(count),
        daily_spend(amount)
      `);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Mock platform data - would need actual platform associations
    return [
      { platform: 'Meta', applications: 150, cpa: 45.50 },
      { platform: 'Indeed', applications: 120, cpa: 52.30 },
      { platform: 'LinkedIn', applications: 80, cpa: 68.20 },
      { platform: 'Craigslist', applications: 60, cpa: 35.80 }
    ];
  },

  /**
   * Fetch monthly budget vs actual spend data
   */
  async getMonthlyBudgetData(organizationId?: string): Promise<MonthlyBudgetData[]> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    let query = supabase
      .from('meta_daily_spend')
      .select('date_start, spend, organization_id')
      .gte('date_start', sixMonthsAgo.toISOString().split('T')[0]);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Group by month
    const grouped = (data || []).reduce((acc: Record<string, number>, item: any) => {
      const month = new Date(item.date_start).toLocaleDateString('en-US', { month: 'short' });
      acc[month] = (acc[month] || 0) + Number(item.spend || 0);
      return acc;
    }, {});

    return Object.entries(grouped).map(([month, spent]) => ({
      month,
      budget: 50000, // Would come from budget_allocations table
      spent
    }));
  },

  /**
   * Fetch job volume data
   */
  async getJobVolumeData(organizationId?: string): Promise<JobVolumeData[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let query = supabase
      .from('job_listings')
      .select('created_at, status, organization_id');

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Group by date and status
    const grouped: Record<string, { active: number; inactive: number }> = {};
    
    (data || []).forEach((job: any) => {
      const date = new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!grouped[date]) {
        grouped[date] = { active: 0, inactive: 0 };
      }
      if (job.status === 'active') {
        grouped[date].active++;
      } else {
        grouped[date].inactive++;
      }
    });

    return Object.entries(grouped).map(([date, values]) => ({
      date,
      active: values.active,
      inactive: values.inactive
    }));
  },

  /**
   * Fetch category breakdown data
   */
  async getCategoryBreakdown(organizationId?: string): Promise<CategoryData[]> {
    let query = supabase
      .from('applications')
      .select(`
        status,
        job_listings!inner(organization_id)
      `);

    if (organizationId) {
      query = query.eq('job_listings.organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const categoryCounts: Record<string, number> = {};
    const totalApplications = data?.length || 0;

    (data || []).forEach((app: any) => {
      const category = app.status || 'pending';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    return Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category,
        count,
        percentage: totalApplications > 0 ? (count / totalApplications) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  },

  /**
   * Fetch dashboard metrics
   */
  async getDashboardMetrics(organizationId?: string): Promise<AnalyticsDashboardMetrics> {
    const { data, error } = await supabase.rpc('get_dashboard_metrics');
    
    if (error) throw error;
    
    const metrics = data as any;
    
    return {
      totalSpend: Number(metrics?.totalSpend || 0),
      totalApplications: Number(metrics?.totalApplications || 0),
      totalJobs: Number(metrics?.totalJobs || 0),
      totalReach: Number(metrics?.totalReach || 0),
      totalImpressions: Number(metrics?.totalImpressions || 0),
      costPerApplication: Number(metrics?.costPerApplication || 0),
      costPerLead: Number(metrics?.costPerLead || 0)
    };
  }
};
