/**
 * Hook for fetching Meta Ad Set level report data
 * Migrated from src/hooks/useMetaAdSetReport.tsx
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

interface AdSetData {
  adSetId: string;
  adSetName: string;
  campaignName: string;
  status: string;
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
}

interface ReportSummary {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalLeads: number;
  totalAdSets: number;
  averageCostPerLead: number;
  avgCTR: number;
  avgCPM: number;
  avgCPC: number;
  dateRange: {
    start: string;
    end: string;
  };
}

interface MetaAdSetReportResponse {
  success: boolean;
  adSets: AdSetData[];
  summary: ReportSummary;
  error?: string;
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

      // Transform the API response to match component expectations
      const transformedData: MetaAdSetReportResponse = {
        success: reportData.success,
        adSets: (reportData.adsets || reportData.adSets || []).map((adSet: any) => ({
          adSetId: adSet.adset_id || adSet.adSetId || '',
          adSetName: adSet.adset_name || adSet.adSetName || 'Unknown',
          campaignName: adSet.campaign_name || adSet.campaignName || 'Unknown',
          status: adSet.status || 'active',
          totalSpend: Number(adSet.spend || adSet.totalSpend || 0),
          totalLeads: Number(adSet.leads || adSet.totalLeads || 0),
          costPerLead: Number(adSet.cost_per_lead || adSet.costPerLead || 0),
          impressions: Number(adSet.impressions || 0),
          clicks: Number(adSet.clicks || 0),
          ctr: Number(adSet.ctr || 0),
          cpm: Number(adSet.cpm || 0),
          cpc: Number(adSet.cpc || 0),
          reach: Number(adSet.reach || 0),
          frequency: Number(adSet.frequency || 0)
        })),
        summary: {
          totalSpend: Number(reportData.summary?.totalSpend || 0),
          totalImpressions: Number(reportData.summary?.totalImpressions || 0),
          totalClicks: Number(reportData.summary?.totalClicks || 0),
          totalLeads: Number(reportData.summary?.totalLeads || 0),
          totalAdSets: Number(reportData.summary?.totalAdSets || 0),
          averageCostPerLead: Number(reportData.summary?.avgCPL || reportData.summary?.averageCostPerLead || 0),
          avgCTR: Number(reportData.summary?.avgCTR || 0),
          avgCPM: Number(reportData.summary?.avgCPM || 0),
          avgCPC: Number(reportData.summary?.avgCPC || 0),
          dateRange: {
            start: reportData.summary?.dateRange?.start || reportData.dateRange?.replace('last_', 'Last ').replace('d', ' days') || dateRange,
            end: reportData.summary?.dateRange?.end || new Date().toLocaleDateString()
          }
        }
      };

      logger.debug('Meta Ad Set report fetched', { totalAdSets: transformedData.summary?.totalAdSets, context: 'meta-adset' });
      setData(transformedData);

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
