
import { useState, useEffect } from 'react';
import { useOpenAI } from '@/hooks/useOpenAI';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/services/loggerService';
import { getActualAccountId } from '@/utils/metaAccountAlias';

interface MetaSpendMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalLeads: number;
  costPerLead: number;
  conversionRate: number;
  insights: string;
  recommendations: string[];
}

export const useMetaSpendAnalytics = (dateRange: string = 'last_30d') => {
  const { organization } = useAuth();
  const [metrics, setMetrics] = useState<MetaSpendMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { invoke } = useOpenAI();

  const fetchAndAnalyzeMetrics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Calculate date range
      const today = new Date();
      let startDate: string;
      
      switch (dateRange) {
        case 'last_7d':
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'last_14d':
          startDate = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'last_60d':
          startDate = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'last_90d':
          startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        default:
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }

      logger.debug('Fetching Meta spend data', { startDate }, 'MetaSpend');

      // Fetch Meta spend data for current organization
      let metaQuery = supabase
        .from('meta_daily_spend')
        .select('*');
        
      if (organization?.id) {
        metaQuery = metaQuery.eq('organization_id', organization.id);
      }
      
      const { data: spendData, error: spendError } = await metaQuery
        .gte('date_start', startDate)
        .order('date_start', { ascending: false });

      if (spendError) {
        logger.error('Error fetching spend data', spendError, 'MetaSpend');
        throw spendError;
      }

      logger.debug('Meta spend data fetched', { recordCount: spendData?.length || 0 }, 'MetaSpend');

      // Get lead generation applications data (from Meta sources, organization-scoped)
      const { data: applicationsData } = await supabase
        .from('applications')
        .select('id, source, applied_at, job_listings!inner(organization_id)')
        .or('source.eq.fb,source.eq.ig,source.eq.meta,source.eq.facebook,source.eq.instagram')
        .eq('job_listings.organization_id', organization?.id)
        .gte('applied_at', startDate);

      const totalLeads = applicationsData?.length || 0;
      logger.debug('Total leads from Meta campaigns', { totalLeads }, 'MetaSpend');

      if (!spendData || spendData.length === 0) {
        logger.info('No Meta spend data found for the selected period', undefined, 'MetaSpend');
        setMetrics({
          totalSpend: 0,
          totalImpressions: 0,
          totalClicks: 0,
          totalLeads,
          costPerLead: 0,
          conversionRate: 0,
          insights: totalLeads > 0 
            ? `Generated ${totalLeads} leads during this period, but no spend data available. Please sync your Meta data to see cost metrics.`
            : 'No Meta spend data or leads found for the selected period. Please sync your Meta data first.',
          recommendations: [
            'Sync Meta data from the platforms page',
            'Check your Meta API connection',
            'Verify lead generation campaign objectives',
            'Review campaign targeting for driver demographics'
          ]
        });
        return;
      }

      // Calculate metrics with proper number conversion
      const totalSpend = spendData.reduce((sum, record) => {
        const spend = Number(record.spend) || 0;
        return sum + spend;
      }, 0);

      const totalImpressions = spendData.reduce((sum, record) => {
        const impressions = Number(record.impressions) || 0;
        return sum + impressions;
      }, 0);

      const totalClicks = spendData.reduce((sum, record) => {
        const clicks = Number(record.clicks) || 0;
        return sum + clicks;
      }, 0);

      const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;
      const conversionRate = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0;

      logger.debug('Calculated lead generation metrics', {
        totalSpend: totalSpend.toFixed(2),
        totalImpressions,
        totalClicks,
        totalLeads,
        costPerLead: costPerLead.toFixed(2),
        conversionRate: conversionRate.toFixed(2)
      }, 'MetaSpend');

      // Use OpenAI to analyze the lead generation data
      const analysisPrompt = `
        Analyze the following Meta lead generation performance data for CR England driver recruitment:
        
        Period: ${dateRange.replace('_', ' ')}
        Total Spend: $${totalSpend.toFixed(2)}
        Total Impressions: ${totalImpressions.toLocaleString()}
        Total Clicks: ${totalClicks.toLocaleString()}
        Total Leads: ${totalLeads}
        Cost per Lead: $${costPerLead.toFixed(2)}
        Conversion Rate: ${conversionRate.toFixed(2)}%
        
        Daily breakdown:
        ${spendData.slice(0, 7).map(d => `${d.date_start}: $${Number(d.spend).toFixed(2)} spent, ${Number(d.impressions).toLocaleString()} impressions, ${Number(d.clicks).toLocaleString()} clicks`).join('\n')}
        
        Please provide:
        1. A brief lead generation performance analysis (2-3 sentences)
        2. 3-5 specific actionable recommendations for improving lead generation campaigns
        
        Focus on trucking/transportation industry context and driver recruitment lead generation strategies.
      `;

      const aiResponse = await invoke({
        message: analysisPrompt,
        model: 'gpt-4.1-2025-04-14',
        systemPrompt: 'You are an expert in digital marketing analytics for the trucking and transportation industry, specializing in lead generation campaigns for driver recruitment.'
      });

      let insights = 'Lead generation performance analysis completed.';
      let recommendations = [
        'Optimize ad creatives for driver demographics',
        'Test different lead generation objectives',
        'Improve landing page conversion rates',
        'Target drivers with specific CDL requirements'
      ];

      if (aiResponse) {
        const lines = aiResponse.generatedText.split('\n').filter(line => line.trim());
        insights = lines.slice(0, 3).join(' ') || insights;
        const aiRecommendations = lines.slice(3).filter(line => 
          line.includes('•') || line.includes('-') || line.match(/^\d+\./)
        ).map(line => line.replace(/^[•\-\d\.]\s*/, ''));
        
        if (aiRecommendations.length > 0) {
          recommendations = aiRecommendations;
        }
      }

      setMetrics({
        totalSpend,
        totalImpressions,
        totalClicks,
        totalLeads,
        costPerLead,
        conversionRate,
        insights,
        recommendations
      });

    } catch (err) {
      logger.error('Error analyzing Meta lead generation metrics', err, 'MetaSpend');
      setError(err instanceof Error ? err.message : 'Failed to analyze Meta lead generation data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAndAnalyzeMetrics();
  }, [dateRange]);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchAndAnalyzeMetrics
  };
};
