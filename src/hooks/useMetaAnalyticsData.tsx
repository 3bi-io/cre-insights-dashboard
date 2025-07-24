import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MetaAnalyticsData {
  summary: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalResults: number;
    costPerResult: number;
    avgCTR: number;
    avgCPM: number;
    avgCPC: number;
  };
  campaignPerformance: Array<{
    name: string;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    adSetsCount: number;
  }>;
  spendDistribution: Array<{
    name: string;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpm: number;
    cpc: number;
  }>;
  insights: string[];
  recommendations: string[];
}

export const useMetaAnalyticsData = () => {
  return useQuery({
    queryKey: ['meta-analytics-data'],
    queryFn: async () => {
      const { data: result, error } = await supabase.functions.invoke('meta-spend-analytics', {
        body: {
          analysisType: 'overview',
          dateRange: 'last_30d'
        }
      });

      if (error) throw error;

      // Transform the data for chart consumption
      const transformedData: MetaAnalyticsData = result;
      
      // Add daily trend data from the analysis
      const dailyTrendData = transformedData.spendDistribution?.slice(0, 7).map((item, index) => ({
        date: new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        spend: item.spend,
        applications: Math.round(item.clicks * 0.1), // Estimate applications from clicks
        impressions: item.impressions,
        clicks: item.clicks
      })) || [];

      // Transform campaign performance for platform comparison
      const platformPerformanceData = transformedData.campaignPerformance?.map(campaign => ({
        platform: campaign.name.split(' ')[0] || 'Meta',
        applications: Math.round(campaign.clicks * 0.1), // Estimate applications
        cpa: campaign.spend / Math.max(campaign.clicks * 0.1, 1), // Cost per application
        spend: campaign.spend,
        impressions: campaign.impressions,
        clicks: campaign.clicks
      })) || [];

      return {
        ...transformedData,
        dailyTrendData,
        platformPerformanceData
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
    retry: 2
  });
};