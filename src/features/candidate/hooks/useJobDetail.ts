import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useJobDetail = (jobId: string | undefined) => {
  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job-detail', jobId],
    queryFn: async () => {
      if (!jobId) return null;

      const { data, error } = await supabase
        .from('job_listings')
        .select(`
          *,
          organizations!inner(
            id,
            name,
            slug
           ),
           clients(
             id,
             name,
             logo_url
          )
        `)
        .eq('id', jobId)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
  });

  return {
    job,
    isLoading,
    error,
  };
};

export const useRecommendedJobs = (currentJobId?: string, limit = 3) => {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['recommended-jobs', currentJobId],
    queryFn: async () => {
      let query = supabase
        .from('job_listings')
        .select(`
          id,
          title,
          city,
          state,
          salary_min,
          salary_max,
          organizations!inner(
            name
           ),
           clients(
             name,
             logo_url
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (currentJobId) {
        query = query.neq('id', currentJobId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  return {
    jobs,
    isLoading,
  };
};
