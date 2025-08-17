import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOutboundWebhook } from '@/hooks/useOutboundWebhook';

export const useApplications = (webhookConfig?: { url: string; enabled: boolean }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { triggerWebhook } = useOutboundWebhook({
    webhookUrl: webhookConfig?.url,
    enabled: webhookConfig?.enabled
  });

  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const { data: appsWithListings, error } = await supabase
        .from('applications')
        .select(`
          *,
          job_listings:job_listing_id(title, job_title, client, client_id, clients:client_id(name)),
          recruiters:recruiter_id(id, first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const missingJobIds = appsWithListings
        ?.filter(app => app.job_id && !app.job_listing_id)
        .map(app => app.job_id)
        .filter((value, index, self) => self.indexOf(value) === index) || [];
      
      let jobListingsMap = new Map();
      if (missingJobIds.length > 0) {
        const { data: jobListings } = await supabase
          .from('job_listings')
          .select('job_id, title, job_title, client, client_id, clients:client_id(name)')
          .in('job_id', missingJobIds);
        
        if (jobListings) {
          jobListings.forEach(job => {
            if (job.job_id) {
              jobListingsMap.set(job.job_id, job);
            }
          });
        }
      }
      
      const enhancedData = appsWithListings?.map(app => {
        if (app.job_id && !app.job_listing_id && jobListingsMap.has(app.job_id)) {
          return { ...app, job_listings: jobListingsMap.get(app.job_id) };
        }
        return app;
      });
      
      return enhancedData;
    },
  });

  const { data: recruiters } = useQuery({
    queryKey: ['recruiters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recruiters')
        .select('*')
        .eq('status', 'active')
        .order('first_name');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: currentRecruiter } = useQuery({
    queryKey: ['current-recruiter'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('recruiters')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  const assignRecruiterMutation = useMutation({
    mutationFn: async ({ applicationId, recruiterId }: { applicationId: string; recruiterId: string | null }) => {
      const { error } = await supabase
        .from('applications')
        .update({ recruiter_id: recruiterId, updated_at: new Date().toISOString() })
        .eq('id', applicationId);
      
      if (error) throw error;
      
      // Trigger outbound webhook for application update
      await triggerWebhook(applicationId, 'updated');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({
        title: "Recruiter Assigned",
        description: "Recruiter has been assigned successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign recruiter. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, newStatus }: { applicationId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', applicationId);
      
      if (error) throw error;
      
      // Trigger outbound webhook for application update
      await triggerWebhook(applicationId, 'updated');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({
        title: "Status Updated",
        description: "Application status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update application status. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    applications,
    recruiters,
    currentRecruiter,
    isLoading,
    assignRecruiter: assignRecruiterMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
  };
};