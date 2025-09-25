import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface CandidateScore {
  id: string;
  application_id: string;
  score_type: string;
  score: number;
  confidence_level: number;
  ai_analysis: any;
  factors: any;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  created_at: string;
}

interface CandidateRanking {
  id: string;
  job_listing_id: string;
  application_id: string;
  rank_position: number;
  overall_score: number;
  match_percentage: number;
  ranking_factors: any;
  last_updated: string;
}

interface AnalysisRequest {
  applicationId: string;
  jobListingId: string;
  analysisType: 'resume' | 'assessment' | 'interview' | 'overall';
  jobRequirements?: string;
  assessmentResponses?: any;
  interviewTranscript?: string;
}

export const useCandidateScoring = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  // Fetch candidate scores for an application
  const useApplicationScores = (applicationId: string) => {
    return useQuery({
      queryKey: ['candidate-scores', applicationId],
      queryFn: async (): Promise<CandidateScore[]> => {
        console.log('Fetching scores for application:', applicationId);
        
        const { data, error } = await supabase
          .from('candidate_scores')
          .select('*')
          .eq('application_id', applicationId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching candidate scores:', error);
          throw error;
        }

        return data || [];
      },
      enabled: !!applicationId,
    });
  };

  // Fetch candidate rankings for a job
  const useJobRankings = (jobListingId: string) => {
    return useQuery({
      queryKey: ['candidate-rankings', jobListingId],
      queryFn: async (): Promise<CandidateRanking[]> => {
        console.log('Fetching rankings for job:', jobListingId);
        
        const { data, error } = await supabase
          .from('candidate_rankings')
          .select(`
            *,
            applications (
              id,
              first_name,
              last_name,
              applicant_email,
              phone,
              applied_at,
              status
            )
          `)
          .eq('job_listing_id', jobListingId)
          .order('rank_position', { ascending: true });

        if (error) {
          console.error('Error fetching candidate rankings:', error);
          throw error;
        }

        return data || [];
      },
      enabled: !!jobListingId,
    });
  };

  // Run AI analysis mutation
  const runAnalysisMutation = useMutation({
    mutationFn: async (request: AnalysisRequest) => {
      console.log('Starting AI analysis:', request);

      const { data, error } = await supabase.functions.invoke('ai-candidate-analysis', {
        body: request
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['candidate-scores', variables.applicationId] });
      queryClient.invalidateQueries({ queryKey: ['candidate-rankings', variables.jobListingId] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });

      toast({
        title: 'Analysis Complete',
        description: `AI analysis completed with score: ${Math.round(data.analysis.overall_score)}/100`,
      });
    },
    onError: (error: any) => {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to complete AI analysis',
        variant: 'destructive',
      });
    },
  });

  // Bulk analyze candidates for a job
  const bulkAnalyzeMutation = useMutation({
    mutationFn: async ({ jobListingId, applicationIds }: { jobListingId: string; applicationIds: string[] }) => {
      console.log('Starting bulk analysis for job:', jobListingId, 'applications:', applicationIds);

      const results = [];
      for (const applicationId of applicationIds) {
        try {
          const { data } = await supabase.functions.invoke('ai-candidate-analysis', {
            body: {
              applicationId,
              jobListingId,
              analysisType: 'overall'
            }
          });
          results.push({ applicationId, success: true, data });
        } catch (error) {
          console.error(`Failed to analyze application ${applicationId}:`, error);
          results.push({ applicationId, success: false, error });
        }
      }

      return results;
    },
    onSuccess: (results, variables) => {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      queryClient.invalidateQueries({ queryKey: ['candidate-rankings', variables.jobListingId] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });

      toast({
        title: 'Bulk Analysis Complete',
        description: `Analyzed ${successful} candidates successfully${failed ? `, ${failed} failed` : ''}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Bulk Analysis Failed',
        description: error.message || 'Failed to complete bulk analysis',
        variant: 'destructive',
      });
    },
  });

  return {
    // Queries
    useApplicationScores,
    useJobRankings,
    
    // Mutations
    runAnalysis: runAnalysisMutation.mutate,
    bulkAnalyze: bulkAnalyzeMutation.mutate,
    
    // Loading states
    isAnalyzing: runAnalysisMutation.isPending,
    isBulkAnalyzing: bulkAnalyzeMutation.isPending,
  };
};