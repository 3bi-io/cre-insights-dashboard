import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type JobGroupAnalysisType = 'suggest_groups' | 'optimize_existing' | 'publisher_recommendation' | 'performance_analysis';

interface JobGroupSuggestion {
  name: string;
  description: string;
  recommended_publisher: string;
  job_ids: string[];
  reasoning: string;
  benefits?: string;
}

interface JobGroupAIAnalysis {
  groups?: JobGroupSuggestion[];
  merge_suggestions?: any[];
  split_suggestions?: any[];
  reassignments?: any[];
  publisher_changes?: any[];
  recommendations?: any[];
  high_potential?: any[];
  needs_optimization?: any[];
  publisher_insights?: any;
  budget_recommendations?: any;
  confidence_score?: number;
  analysis_type?: string;
  jobs_analyzed?: number;
  generated_at?: string;
}

export const useJobGroupAI = (campaignId: string | null, organizationId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch cached suggestions
  const { data: cachedSuggestions, refetch } = useQuery({
    queryKey: ['job-group-suggestions', campaignId],
    queryFn: async () => {
      if (!campaignId) return null;

      const { data, error } = await supabase
        .from('job_group_suggestions')
        .select('*')
        .eq('campaign_id', campaignId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
    staleTime: 5 * 60 * 1000,
  });

  const analyzeJobGroups = async (
    analysisType: JobGroupAnalysisType,
    options: {
      jobListingIds?: string[];
    } = {}
  ): Promise<JobGroupAIAnalysis | null> => {
    if (!campaignId && !organizationId) {
      toast({
        title: 'Error',
        description: 'Campaign or organization ID required',
        variant: 'destructive',
      });
      return null;
    }

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('job-group-ai-manager', {
        body: {
          organizationId,
          campaignId,
          analysisType,
          jobListingIds: options.jobListingIds,
        },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to analyze job groups');
      }

      await refetch();

      toast({
        title: 'Analysis Complete',
        description: `${analysisType.replace(/_/g, ' ').charAt(0).toUpperCase() + analysisType.replace(/_/g, ' ').slice(1)} analysis generated successfully.`,
      });

      return data.analysis;
    } catch (error) {
      console.error('Job group AI analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze job groups',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Accept suggestion mutation
  const acceptSuggestionMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase
        .from('job_group_suggestions')
        .update({ status: 'accepted' })
        .eq('id', suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-group-suggestions'] });
      toast({
        title: 'Suggestion Accepted',
        description: 'Job group suggestion has been accepted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept suggestion',
        variant: 'destructive',
      });
    },
  });

  // Reject suggestion mutation
  const rejectSuggestionMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase
        .from('job_group_suggestions')
        .update({ status: 'rejected' })
        .eq('id', suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-group-suggestions'] });
      toast({
        title: 'Suggestion Rejected',
        description: 'Job group suggestion has been rejected.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject suggestion',
        variant: 'destructive',
      });
    },
  });

  const getSuggestionsByStatus = (status: string) => {
    return cachedSuggestions?.filter(s => s.status === status) || [];
  };

  return {
    cachedSuggestions,
    isAnalyzing,
    analyzeJobGroups,
    acceptSuggestion: acceptSuggestionMutation.mutate,
    rejectSuggestion: rejectSuggestionMutation.mutate,
    getSuggestionsByStatus,
    hasSuggestions: (cachedSuggestions?.length || 0) > 0,
  };
};