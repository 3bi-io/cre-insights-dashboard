import { useState, useEffect } from 'react';
import { metaAnalyticsService } from '../services';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import type { AnalyticsMetaSpendMetrics, DateRange } from '../types';

export const useMetaSpendAnalytics = (dateRange: DateRange = 'last_30d') => {
  const { organization } = useAuth();
  const [metrics, setMetrics] = useState<AnalyticsMetaSpendMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAndAnalyzeMetrics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const baseMetrics = await metaAnalyticsService.fetchMetrics(
        dateRange,
        organization?.id
      );

      const aiAnalysis = await metaAnalyticsService.generateInsights(baseMetrics);

      setMetrics({
        ...baseMetrics,
        ...aiAnalysis
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      logger.error('Error fetching Meta analytics', err, 'Analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAndAnalyzeMetrics();
  }, [dateRange, organization?.id]);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchAndAnalyzeMetrics
  };
};
