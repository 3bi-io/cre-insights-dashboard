
import { useState, useEffect } from 'react';
import { useOpenAI } from '@/hooks/useOpenAI';
import { supabase } from '@/integrations/supabase/client';

interface MetaSpendMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
  cpm: number;
  cpc: number;
  insights: string;
  recommendations: string[];
}

export const useMetaSpendAnalytics = (dateRange: string = 'last_30d') => {
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

      console.log('Fetching Meta spend data from:', startDate);

      // Fetch Meta spend data
      const { data: spendData, error: spendError } = await supabase
        .from('meta_daily_spend')
        .select('*')
        .eq('account_id', '435031743763874')
        .gte('date_start', startDate)
        .order('date_start', { ascending: false });

      if (spendError) {
        console.error('Error fetching spend data:', spendError);
        throw spendError;
      }

      console.log('Meta spend data fetched:', spendData?.length || 0, 'records');

      if (!spendData || spendData.length === 0) {
        console.log('No Meta spend data found for the selected period');
        setMetrics({
          totalSpend: 0,
          totalImpressions: 0,
          totalClicks: 0,
          ctr: 0,
          cpm: 0,
          cpc: 0,
          insights: 'No Meta spend data available for the selected period. Please sync your Meta data first.',
          recommendations: [
            'Sync Meta data from the platforms page',
            'Check your Meta API connection',
            'Verify your account ID is correct'
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

      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
      const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

      console.log('Calculated metrics:', {
        totalSpend,
        totalImpressions,
        totalClicks,
        ctr,
        cpm,
        cpc
      });

      // Get applications data for context
      const { data: applicationsData } = await supabase
        .from('applications')
        .select('id, source, applied_at')
        .or('source.eq.fb,source.eq.ig,source.eq.meta')
        .gte('applied_at', startDate);

      const totalApplications = applicationsData?.length || 0;

      // Use OpenAI to analyze the data
      const analysisPrompt = `
        Analyze the following Meta advertising performance data for CR England:
        
        Period: ${dateRange.replace('_', ' ')}
        Total Spend: $${totalSpend.toFixed(2)}
        Total Impressions: ${totalImpressions.toLocaleString()}
        Total Clicks: ${totalClicks.toLocaleString()}
        CTR: ${ctr.toFixed(2)}%
        CPM: $${cpm.toFixed(2)}
        CPC: $${cpc.toFixed(2)}
        Applications: ${totalApplications}
        Cost per Application: $${totalApplications > 0 ? (totalSpend / totalApplications).toFixed(2) : 'N/A'}
        
        Daily breakdown:
        ${spendData.slice(0, 7).map(d => `${d.date_start}: $${Number(d.spend).toFixed(2)} spent, ${Number(d.impressions).toLocaleString()} impressions, ${Number(d.clicks).toLocaleString()} clicks`).join('\n')}
        
        Please provide:
        1. A brief performance analysis (2-3 sentences)
        2. 3-5 specific actionable recommendations for improvement
        
        Focus on trucking/transportation industry context and driver recruitment.
      `;

      const aiResponse = await invoke({
        message: analysisPrompt,
        model: 'gpt-4.1-2025-04-14',
        systemPrompt: 'You are an expert in digital marketing analytics for the trucking and transportation industry, specializing in driver recruitment campaigns.'
      });

      let insights = 'Performance analysis completed.';
      let recommendations = [
        'Continue monitoring performance metrics',
        'Consider A/B testing different ad creatives',
        'Optimize targeting for driver demographics'
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
        ctr,
        cpm,
        cpc,
        insights,
        recommendations
      });

    } catch (err) {
      console.error('Error analyzing Meta spend metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze Meta spend data');
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
