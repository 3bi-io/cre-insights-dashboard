import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface CallWebhook {
  id: string;
  organization_id: string;
  webhook_url: string;
  enabled: boolean;
  event_types: string[];
  secret_key: string | null;
  last_triggered_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface CallWebhookLog {
  id: string;
  webhook_id: string;
  outbound_call_id: string;
  event_type: string;
  request_payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface CreateCallWebhookInput {
  webhook_url: string;
  enabled?: boolean;
  event_types?: string[];
  secret_key?: string;
}

export interface UpdateCallWebhookInput {
  id: string;
  webhook_url?: string;
  enabled?: boolean;
  event_types?: string[];
  secret_key?: string | null;
}

export function useCallWebhooks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const organizationId = organization?.id;

  // Fetch all call webhooks for the organization
  const {
    data: webhooks,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['call-webhooks', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('call_webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CallWebhook[];
    },
    enabled: !!organizationId,
  });

  // Fetch webhook logs
  const useWebhookLogs = (webhookId?: string) => {
    return useQuery({
      queryKey: ['call-webhook-logs', webhookId],
      queryFn: async () => {
        let query = supabase
          .from('call_webhook_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (webhookId) {
          query = query.eq('webhook_id', webhookId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as CallWebhookLog[];
      },
      enabled: !!webhookId || !!organizationId,
    });
  };

  // Create a new call webhook
  const createMutation = useMutation({
    mutationFn: async (input: CreateCallWebhookInput) => {
      if (!organizationId) throw new Error('Organization ID required');

      const { data, error } = await supabase
        .from('call_webhooks')
        .insert({
          organization_id: organizationId,
          webhook_url: input.webhook_url,
          enabled: input.enabled ?? true,
          event_types: input.event_types ?? ['completed', 'failed', 'no_answer'],
          secret_key: input.secret_key || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CallWebhook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-webhooks'] });
      toast({
        title: 'Webhook Created',
        description: 'Call webhook has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create webhook',
        variant: 'destructive',
      });
    },
  });

  // Update an existing call webhook
  const updateMutation = useMutation({
    mutationFn: async (input: UpdateCallWebhookInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from('call_webhooks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CallWebhook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-webhooks'] });
      toast({
        title: 'Webhook Updated',
        description: 'Call webhook has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update webhook',
        variant: 'destructive',
      });
    },
  });

  // Delete a call webhook
  const deleteMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      const { error } = await supabase
        .from('call_webhooks')
        .delete()
        .eq('id', webhookId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-webhooks'] });
      toast({
        title: 'Webhook Deleted',
        description: 'Call webhook has been deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete webhook',
        variant: 'destructive',
      });
    },
  });

  // Test a webhook
  const testMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      const { data, error } = await supabase.functions.invoke('elevenlabs-call-status', {
        body: {
          action: 'test_webhook',
          webhook_id: webhookId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast({
          title: 'Test Successful',
          description: 'Webhook endpoint responded successfully.',
        });
      } else {
        toast({
          title: 'Test Failed',
          description: data?.error || 'Webhook endpoint did not respond as expected.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Test Failed',
        description: error.message || 'Failed to test webhook',
        variant: 'destructive',
      });
    },
  });

  return {
    webhooks,
    isLoading,
    error,
    useWebhookLogs,
    createWebhook: createMutation.mutate,
    createWebhookAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateWebhook: updateMutation.mutate,
    updateWebhookAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteWebhook: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    testWebhook: testMutation.mutate,
    isTesting: testMutation.isPending,
  };
}
