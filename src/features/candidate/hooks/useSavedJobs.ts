import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useSavedJobs = () => {
  const { candidateProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedJobs, isLoading } = useQuery({
    queryKey: ['saved-jobs', candidateProfile?.id],
    queryFn: async () => {
      if (!candidateProfile?.id) return [];

      const { data, error } = await supabase
        .from('candidate_saved_jobs' as any)
        .select(`
          *,
          job_listings!inner(
            *,
            organizations!inner(
              name,
              logo_url
            )
          )
        `)
        .eq('candidate_profile_id', candidateProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!candidateProfile?.id,
  });

  const saveJob = useMutation({
    mutationFn: async ({ jobId, notes }: { jobId: string; notes?: string }) => {
      if (!candidateProfile?.id) throw new Error('No candidate profile');

      const { error } = await supabase
        .from('candidate_saved_jobs' as any)
        .insert({
          candidate_profile_id: candidateProfile.id,
          job_listing_id: jobId,
          notes,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
      toast({
        title: 'Job saved',
        description: 'Job has been added to your saved list.',
      });
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast({
          title: 'Already saved',
          description: 'This job is already in your saved list.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save job. Please try again.',
          variant: 'destructive',
        });
      }
    },
  });

  const unsaveJob = useMutation({
    mutationFn: async (savedJobId: string) => {
      const { error } = await supabase
        .from('candidate_saved_jobs' as any)
        .delete()
        .eq('id', savedJobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
      toast({
        title: 'Job removed',
        description: 'Job has been removed from your saved list.',
      });
    },
  });

  const isJobSaved = (jobId: string) => {
    return savedJobs?.some((saved: any) => saved.job_listing_id === jobId);
  };

  return {
    savedJobs,
    isLoading,
    saveJob: saveJob.mutate,
    unsaveJob: unsaveJob.mutate,
    isSaving: saveJob.isPending,
    isJobSaved,
  };
};
