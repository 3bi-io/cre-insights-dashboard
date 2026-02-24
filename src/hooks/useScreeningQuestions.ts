import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ScreeningOption {
  value: string;
  label: string;
  is_correct?: boolean;
}

export interface ScreeningQuestion {
  id: string;
  question: string;
  type: 'select';
  required: boolean;
  options: ScreeningOption[];
}

/**
 * Fetches screening questions for an organization based on job_listing_id.
 * Uses a SECURITY DEFINER function so anonymous users can access it.
 */
export const useScreeningQuestions = (jobListingId: string | null) => {
  return useQuery<ScreeningQuestion[] | null>({
    queryKey: ['screening-questions', jobListingId],
    queryFn: async () => {
      if (!jobListingId) return null;

      const { data, error } = await supabase.rpc('get_screening_questions_for_job', {
        p_job_listing_id: jobListingId,
      });

      if (error || !data) return null;

      return data as unknown as ScreeningQuestion[];
    },
    enabled: !!jobListingId,
    staleTime: 1000 * 60 * 10,
  });
};
