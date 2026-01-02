import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SavedJob {
  id: string;
  job_listing_id: string;
  notes?: string;
  created_at: string;
  job_listings: {
    id: string;
    title: string;
    location?: string;
    city?: string;
    state?: string;
    salary_min?: number;
    salary_max?: number;
    organizations: {
      name: string;
      logo_url?: string;
    };
  };
}

interface PostgresError {
  code?: string;
  message?: string;
}

async function fetchSavedJobs(candidateProfileId: string): Promise<SavedJob[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('candidate_saved_jobs')
    .select(`
      id,
      job_listing_id,
      notes,
      created_at,
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
    .eq('candidate_profile_id', candidateProfileId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as SavedJob[];
}

export const useSavedJobs = () => {
  const { candidateProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedJobs, isLoading } = useQuery({
    queryKey: ['saved-jobs', candidateProfile?.id],
    queryFn: () => fetchSavedJobs(candidateProfile!.id),
    enabled: !!candidateProfile?.id,
  });

  const saveJob = useMutation({
    mutationFn: async ({ jobId, notes }: { jobId: string; notes?: string }) => {
      if (!candidateProfile?.id) throw new Error('No candidate profile');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('candidate_saved_jobs')
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
    onError: (error: PostgresError) => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('candidate_saved_jobs')
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

  const isJobSaved = (jobId: string): boolean => {
    return savedJobs?.some((saved) => saved.job_listing_id === jobId) ?? false;
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
