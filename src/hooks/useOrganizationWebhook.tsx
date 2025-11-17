import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrganizationWebhook {
  id: string;
  organization_id: string;
  webhook_url: string;
  enabled: boolean;
  secret_key: string | null;
  last_triggered_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

interface WebhookFormData {
  webhook_url: string;
  enabled: boolean;
  secret_key?: string;
}

export const useOrganizationWebhook = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch organization webhook configuration
  const { data: webhook, isLoading, error } = useQuery({
    queryKey: ['organization-webhook'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.organization_id) return null;

      const { data, error } = await supabase
        .from('organization_webhooks')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .maybeSingle();

      if (error) throw error;
      return data as OrganizationWebhook | null;
    },
  });

  // Create or update webhook configuration
  const saveMutation = useMutation({
    mutationFn: async (formData: WebhookFormData) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.organization_id) {
        throw new Error('No organization found');
      }

      const webhookData = {
        organization_id: profile.organization_id,
        webhook_url: formData.webhook_url,
        enabled: formData.enabled,
        secret_key: formData.secret_key || null,
      };

      if (webhook?.id) {
        // Update existing
        const { data, error } = await supabase
          .from('organization_webhooks')
          .update(webhookData)
          .eq('id', webhook.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('organization_webhooks')
          .insert(webhookData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-webhook'] });
      toast({
        title: 'Success',
        description: 'Webhook configuration saved successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete webhook configuration
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!webhook?.id) throw new Error('No webhook to delete');

      const { error } = await supabase
        .from('organization_webhooks')
        .delete()
        .eq('id', webhook.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-webhook'] });
      toast({
        title: 'Success',
        description: 'Webhook configuration deleted',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Test webhook with sample data
  const testMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('organization-webhook-export', {
        body: {
          application_ids: [],
          filters: {},
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Test Successful',
        description: `Sent ${data.applications_sent} applications to n8n webhook`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Test Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Export filtered applications
  const exportMutation = useMutation({
    mutationFn: async ({ filters }: { filters: Record<string, any> }) => {
      const { data, error } = await supabase.functions.invoke('organization-webhook-export', {
        body: {
          filters,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Export Successful',
        description: `Sent ${data.applications_sent} applications to n8n`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Export Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    webhook,
    isLoading,
    error,
    saveWebhook: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    deleteWebhook: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    testWebhook: testMutation.mutate,
    isTesting: testMutation.isPending,
    exportApplications: exportMutation.mutate,
    isExporting: exportMutation.isPending,
  };
};
