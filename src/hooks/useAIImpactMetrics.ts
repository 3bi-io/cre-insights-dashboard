import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AIImpactMetrics {
  totalInteractions: number;
  avgResponseTime: number;
  satisfactionRate: number;
  automationSavings: number;
  timeToHireComparison: {
    aiAvg: number;
    traditionalAvg: number;
    improvement: number;
  };
  qualityScoreComparison: {
    aiAvg: number;
    traditionalAvg: number;
    improvement: number;
  };
  automationBreakdown: {
    screening: number;
    initialContact: number;
    faqResolution: number;
  };
  performanceImprovements: {
    responseTime: number;
    applicationProcessing: number;
    candidateEngagement: number;
  };
}

export const useAIImpactMetrics = (daysBack: number = 30) => {
  return useQuery({
    queryKey: ['ai-impact-metrics', daysBack],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-metrics-aggregator', {
        body: { days: daysBack }
      });

      if (error) {
        console.error('Error fetching AI impact metrics:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch AI metrics');
      }

      return data.metrics as AIImpactMetrics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};
