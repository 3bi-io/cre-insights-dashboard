import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useCandidateApplications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications, isLoading, error } = useQuery({
    queryKey: ['candidate-applications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('applications' as any)
        .select(`
          *,
          job_listings!inner(
            id,
            title,
            location,
            city,
            state,
            salary_min,
            salary_max,
            organizations!inner(
              name,
              logo_url
            )
          )
        `)
        .eq('candidate_user_id', user.id)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const withdrawApplication = useMutation({
    mutationFn: async ({ applicationId, reason }: { applicationId: string; reason?: string }) => {
      const { error } = await supabase
        .from('applications' as any)
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
    onError: (error) => {
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
