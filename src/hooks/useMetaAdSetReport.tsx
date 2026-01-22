import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

interface AdSetReportData {
  adSetName: string;
  adSetId: string;
  campaignName: string;
  campaignId: string;
  totalSpend: number;
  totalLeads: number;
  costPerLead: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  cpc: number;
  reach: number;
  frequency: number;
  status: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
  createdTime?: string;
  updatedTime?: string;
}

interface ReportSummary {
  totalAdSets: number;
  totalSpend: number;
  totalLeads: number;
  totalImpressions: number;
  totalClicks: number;
  averageCostPerLead: number;
  dateRange: {
    start: string;
    end: string;
  };
}

interface MetaAdSetReportResponse {
  success: boolean;
  summary: ReportSummary | null;
  adSets: AdSetReportData[];
  error?: string;
  generatedAt: string;
}

export const useMetaAdSetReport = (dateRange: string = 'last_30d') => {
  const { organization } = useAuth();
  const [data, setData] = useState<MetaAdSetReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      logger.debug('Fetching Meta Ad Set report', { dateRange, organizationId: organization?.id, context: 'meta-adset' });

      const { data: reportData, error: reportError } = await supabase.functions.invoke(
        'meta-adset-report',
        {
          body: {
            dateRange,
            organizationId: organization?.id
          }
        }
      );

      if (reportError) {
        logger.error('Meta adset report function error', reportError, { context: 'meta-adset' });
        throw reportError;
      }

      if (!reportData || !reportData.success) {
        logger.error('Report data unsuccessful', new Error(reportData?.error), { context: 'meta-adset' });
        throw new Error(reportData?.error || 'Failed to generate Ad Set report');
      }

      logger.debug('Meta Ad Set report fetched', { totalAdSets: reportData.summary?.totalAdSets, context: 'meta-adset' });
      setData(reportData);

    } catch (err) {
      logger.error('Failed to fetch Meta Ad Set report', err, { context: 'meta-adset' });
      setError(err instanceof Error ? err.message : 'Failed to fetch Ad Set report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [dateRange, organization?.id]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchReport
  };
};