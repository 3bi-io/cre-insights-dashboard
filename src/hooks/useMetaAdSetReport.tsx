import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
      console.log('Fetching Meta Ad Set report for date range:', dateRange);
      console.log('Organization ID:', organization?.id);
      console.log('Organization data:', organization);

      const { data: reportData, error: reportError } = await supabase.functions.invoke(
        'meta-adset-report',
        {
          body: {
            dateRange,
            organizationId: organization?.id
          }
        }
      );

      console.log('Edge function response - reportData:', reportData);
      console.log('Edge function response - reportError:', reportError);

      if (reportError) {
        console.error('Error calling meta-adset-report function:', reportError);
        throw reportError;
      }

      if (!reportData || !reportData.success) {
        console.error('Report data unsuccessful:', reportData);
        throw new Error(reportData?.error || 'Failed to generate Ad Set report');
      }

      console.log('Meta Ad Set report fetched successfully:', reportData.summary);
      setData(reportData);

    } catch (err) {
      console.error('Error fetching Meta Ad Set report:', err);
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