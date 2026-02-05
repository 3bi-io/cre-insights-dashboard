import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CandidateApplication {
  id: string;
  status: string;
  applied_at: string;
  candidate_withdrawn_at?: string;
  candidate_withdraw_reason?: string;
  job_listings: {
    id: string;
    title: string;
    job_title?: string;
    location?: string;
    city?: string;
    state?: string;
    salary_min?: number;
    salary_max?: number;
    clients?: {
      name: string;
      logo_url?: string;
    };
    organizations: {
      name: string;
      logo_url?: string;
    };
  };
}

async function fetchCandidateApplications(userId: string): Promise<CandidateApplication[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('applications')
    .select(`
      id,
      status,
      applied_at,
      candidate_withdrawn_at,
      candidate_withdraw_reason,
      job_listings!inner(
        id,
        title,
        job_title,
        location,
        city,
        state,
        salary_min,
        salary_max,
        clients(name, logo_url),
        organizations!inner(
          name,
          logo_url
        )
      )
    `)
    .eq('candidate_user_id', userId)
    .order('applied_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as CandidateApplication[];
}

export const useCandidateApplications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications, isLoading, error } = useQuery({
    queryKey: ['candidate-applications', user?.id],
    queryFn: () => fetchCandidateApplications(user!.id),
    enabled: !!user?.id,
  });

  const withdrawApplication = useMutation({
    mutationFn: async ({ applicationId, reason }: { applicationId: string; reason?: string }) => {
      const { error } = await supabase
        .from('applications')
        .update({
          candidate_withdrawn_at: new Date().toISOString(),
          candidate_withdraw_reason: reason,
          status: 'withdrawn'
        })
        .eq('id', applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-applications'] });
      toast({
        title: 'Application withdrawn',
        description: 'Your application has been withdrawn successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to withdraw application. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    applications,
    isLoading,
    error,
    withdrawApplication: withdrawApplication.mutate,
    isWithdrawing: withdrawApplication.isPending,
  };
};
