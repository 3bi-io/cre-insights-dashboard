import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  zip?: string;
  desired_job_title?: string;
  desired_salary_min?: number | null;
  desired_salary_max?: number | null;
  summary?: string;
  headline?: string;
  years_experience?: number | null;
  cdl_class?: string;
  cdl_endorsements?: string[];
  open_to_opportunities?: boolean;
  profile_visibility?: string;
}

export const useUpdateCandidateProfile = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateProfile = useMutation({
    mutationFn: async ({ profileId, data }: { profileId: string; data: ProfileUpdateData }) => {
      // Calculate profile completion
      const fieldsToCheck = [
        'first_name', 'last_name', 'email', 'phone', 'city', 'state',
        'desired_job_title', 'summary', 'years_experience'
      ];
      
      const completedFields = fieldsToCheck.filter(field => {
        const value = data[field as keyof ProfileUpdateData];
        return value !== undefined && value !== null && value !== '';
      });
      
      const completionPercentage = Math.round((completedFields.length / fieldsToCheck.length) * 100);

      const { data: updatedProfile, error } = await supabase
        .from('candidate_profiles')
        .update({
          ...data,
          profile_completion_percentage: completionPercentage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId)
        .select()
        .single();

      if (error) throw error;
      return updatedProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving profile',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    updateProfile: updateProfile.mutate,
    isUpdating: updateProfile.isPending,
    error: updateProfile.error,
  };
};
