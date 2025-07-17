import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSpendTrendData = () => {
  return useQuery({
    queryKey: ['spend-trend-data'],
    queryFn: async () => {
      const { data: spendData, error } = await supabase
        .from('daily_spend')
        .select(`
          date,
          amount,
          clicks,
          views,
          job_listings!inner(*)
        `)
        .order('date', { ascending: true })
        .limit(30);

      if (error) throw error;

      // Group by date and sum amounts
      const groupedData = spendData.reduce((acc: any, curr: any) => {
        const date = new Date(curr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!acc[date]) {
          acc[date] = { date, spend: 0, clicks: 0, views: 0, applications: 0 };
        }
        acc[date].spend += Number(curr.amount);
        acc[date].clicks += curr.clicks || 0;
        acc[date].views += curr.views || 0;
        return acc;
      }, {});

      // Get applications count per day
      const { data: applicationsData } = await supabase
        .from('applications')
        .select('applied_at')
        .gte('applied_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Add applications to grouped data
      applicationsData?.forEach((app: any) => {
        const date = new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (groupedData[date]) {
          groupedData[date].applications += 1;
        }
      });

      return Object.values(groupedData).slice(-7); // Last 7 days
    }
  });
};

export const usePlatformDistributionData = () => {
  return useQuery({
    queryKey: ['platform-distribution-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          job_listings!inner(
            platform_id,
            platforms!inner(name)
          )
        `);

      if (error) throw error;

      // Count applications by platform
      const platformCounts = data.reduce((acc: any, curr: any) => {
        const platformName = curr.job_listings.platforms.name;
        acc[platformName] = (acc[platformName] || 0) + 1;
        return acc;
      }, {});

      // Convert to chart format with colors
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      return Object.entries(platformCounts).map(([name, value], index) => ({
        name,
        value: value as number,
        color: colors[index % colors.length]
      }));
    }
  });
};

export const usePlatformPerformanceData = () => {
  return useQuery({
    queryKey: ['platform-performance-data'],
    queryFn: async () => {
      const { data: platformData, error } = await supabase
        .from('platforms')
        .select(`
          name,
          job_listings(
            id,
            daily_spend(amount),
            applications(id)
          )
        `);

      if (error) throw error;

      return platformData.map((platform: any) => {
        const applications = platform.job_listings.reduce((acc: number, job: any) => 
          acc + job.applications.length, 0);
        const spend = platform.job_listings.reduce((acc: number, job: any) => 
          acc + job.daily_spend.reduce((sum: number, spend: any) => sum + Number(spend.amount), 0), 0);
        const cpa = applications > 0 ? spend / applications : 0;

        return {
          platform: platform.name,
          applications,
          spend,
          cpa: Number(cpa.toFixed(2))
        };
      });
    }
  });
};

export const useMonthlyBudgetData = () => {
  return useQuery({
    queryKey: ['monthly-budget-data'],
    queryFn: async () => {
      const { data: spendData, error } = await supabase
        .from('daily_spend')
        .select('date, amount')
        .order('date', { ascending: true });

      if (error) throw error;

      // Group by month
      const monthlyData = spendData.reduce((acc: any, curr: any) => {
        const date = new Date(curr.date);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        
        if (!acc[monthKey]) {
          acc[monthKey] = { month: monthKey, spent: 0, budget: 15000 };
        }
        acc[monthKey].spent += Number(curr.amount);
        return acc;
      }, {});

      return Object.values(monthlyData).map((data: any) => ({
        ...data,
        remaining: data.budget - data.spent
      })).slice(-6); // Last 6 months
    }
  });
};