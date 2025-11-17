import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface BasicApplicationData {
  id: string;
  job_listing_id: string;
  first_name: string;
  last_name: string;
  applicant_email: string;
  phone: string;
  status: string;
  applied_at: string;
  source: string;
  notes: string;
  exp: string;
  cdl: string;
  education_level: string;
  work_authorization: string;
  city: string;
  state: string;
  zip: string;
}

export interface SensitiveApplicationData {
  id: string;
  ssn: string;
  government_id_type: string;
  government_id: string;
  date_of_birth: string;
  full_address: string;
  employment_history: any;
  medical_card_expiration: string;
  felony_details: string;
  military_history: any;
}

export interface ApplicationSummary {
  id: string;
  job_title: string;
  candidate_name: string;
  status: string;
  applied_at: string;
  location: string;
  experience_level: string;
  can_start_soon: boolean;
  has_required_credentials: boolean;
}

export const useSecureApplicationData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole } = useAuth();

  // Get basic application data (safe for most users)
  const useBasicApplicationData = (applicationId: string) => {
    return useQuery({
      queryKey: ['application-basic', applicationId],
      queryFn: async (): Promise<BasicApplicationData | null> => {
        if (!applicationId) return null;
        
        const { data, error } = await supabase
          .rpc('get_application_basic_data', { 
            application_id: applicationId 
          })
          .single();

        if (error) {
          console.error('Error fetching basic application data:', error);
          throw error;
        }

        return data;
      },
      enabled: !!applicationId,
    });
  };

  // Get application summary (minimal safe data)
  const useApplicationSummary = (applicationId: string) => {
    return useQuery({
      queryKey: ['application-summary', applicationId],
      queryFn: async (): Promise<ApplicationSummary | null> => {
        if (!applicationId) return null;
        
        const { data, error } = await supabase
          .rpc('get_application_summary', { 
            application_id: applicationId 
          })
          .single();

        if (error) {
          console.error('Error fetching application summary:', error);
          throw error;
        }

        return data;
      },
      enabled: !!applicationId,
    });
  };

  // Get sensitive data (only for authorized admins)
  const useSensitiveApplicationData = (applicationId: string, accessReason: string = 'Administrative review') => {
    return useQuery({
      queryKey: ['application-sensitive', applicationId, accessReason],
      queryFn: async (): Promise<SensitiveApplicationData | null> => {
        if (!applicationId) return null;

        // Only allow super admins and org admins to access sensitive data
        if (userRole !== 'super_admin' && userRole !== 'admin') {
          throw new Error('Insufficient privileges to access sensitive personal information');
        }
        
        const { data, error } = await supabase
          .rpc('get_application_sensitive_data', { 
            application_id: applicationId,
            access_reason: accessReason
          })
          .single();

        if (error) {
          console.error('Error fetching sensitive application data:', error);
          throw error;
        }

        return data;
      },
      enabled: !!applicationId && (userRole === 'super_admin' || userRole === 'admin'),
    });
  };

  // Mutation to access sensitive data with reason logging
  const accessSensitiveDataMutation = useMutation({
    mutationFn: async ({ applicationId, reason }: { applicationId: string; reason: string }) => {
      if (userRole !== 'super_admin' && userRole !== 'admin') {
        throw new Error('Access denied: Insufficient privileges');
      }

      const { data, error } = await supabase
        .rpc('get_application_sensitive_data', {
          application_id: applicationId,
          access_reason: reason
        })
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Update the cache with the new data
      queryClient.setQueryData(['application-sensitive', variables.applicationId, variables.reason], data);
      
      toast({
        title: 'Sensitive Data Accessed',
        description: 'Access has been logged for audit purposes.',
      });
    },
    onError: (error: any) => {
      console.error('Sensitive data access error:', error);
      toast({
        title: 'Access Denied',
        description: error.message || 'Failed to access sensitive information',
        variant: 'destructive',
      });
    },
  });

  return {
    // Queries
    useBasicApplicationData,
    useApplicationSummary,
    useSensitiveApplicationData,
    
    // Mutations
    accessSensitiveData: accessSensitiveDataMutation.mutate,
    
    // Loading states
    isAccessingSensitiveData: accessSensitiveDataMutation.isPending,
    
    // Utilities
    canAccessSensitiveData: userRole === 'super_admin' || userRole === 'admin',
  };
};