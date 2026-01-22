/**
 * Hook for tracking recruitment spend trends over time
 * Migrated from src/hooks/useSpendTrendData.tsx
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';

export const useSpendTrendData = () => {
  const { organization } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.analytics.spendTrend(organization?.id),
    queryFn: async () => {
      const { data: spendData, error } = await supabase
        .from('daily_spend')
        .select(`
          date,
          amount,
          clicks,
          views,
          job_listings!inner(organization_id)
        `)
        .eq('job_listings.organization_id', organization?.id)
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

      // Get applications count per day (organization-scoped)
      const { data: applicationsData } = await supabase
        .from('applications')
        .select('applied_at, job_listings!inner(organization_id)')
        .eq('job_listings.organization_id', organization?.id)
        .gte('applied_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Add applications to grouped data
      applicationsData?.forEach((app: any) => {
        const date = new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (groupedData[date]) {
          groupedData[date].applications += 1;
        }
      });

      return Object.values(groupedData).slice(-7); // Last 7 days
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!organization?.id, // Only run when organization is available
  });
};
