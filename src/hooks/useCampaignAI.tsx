import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type CampaignAnalysisType = 'performance' | 'optimization' | 'prediction' | 'publisher_comparison';

interface CampaignAIAnalysis {
  insights?: string[] | any;
  recommendations?: Array<{
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    difficulty: 'easy' | 'moderate' | 'hard';
    timeline?: string;
  }>;
  metrics?: Record<string, any>;
  forecast?: any;
  trends?: any[];
  confidence_score?: number;
  analysis_type?: string;
  generated_at?: string;
}

export const useCampaignAI = (campaignId: string | null) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch cached analysis
  const { data: cachedAnalysis, refetch } = useQuery({
    queryKey: ['campaign-ai-analysis', campaignId],
    queryFn: async () => {
      if (!campaignId) return null;

      const { data, error } = await supabase
        .from('campaign_ai_analysis')
        .select('*')
        .eq('campaign_id', campaignId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const analyzeCampaign = async (
    analysisType: CampaignAnalysisType,
    options: {
      includeJobGroups?: boolean;
      includePublishers?: boolean;
    } = {}
  ): Promise<CampaignAIAnalysis | null> => {
    if (!campaignId) {
      toast({
        title: 'Error',
        description: 'No campaign selected',
        variant: 'destructive',
      });
      return null;
    }

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('campaign-ai-optimizer', {
        body: {
          campaignId,
          analysisType,
          includeJobGroups: options.includeJobGroups ?? true,
          includePublishers: options.includePublishers ?? true,
        },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to analyze campaign');
      }

      // Refetch cached analysis to get the latest
      await refetch();

      toast({
        title: 'Analysis Complete',
        description: `${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)} analysis generated successfully.`,
      });

      return data.analysis;
    } catch (error) {
      console.error('Campaign AI analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze campaign',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAnalysisByType = (type: CampaignAnalysisType) => {
    return cachedAnalysis?.find(a => a.analysis_type === type);
  };

  return {
    cachedAnalysis,
    isAnalyzing,
    analyzeCampaign,
    getAnalysisByType,
    hasAnalysis: (type: CampaignAnalysisType) => !!getAnalysisByType(type),
  };
};