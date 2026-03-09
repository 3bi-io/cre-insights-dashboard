/**
 * Hook for managing outbound voice calls
 * Migrated from src/hooks/useOutboundCalls.tsx
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  OutboundCall, 
  OutboundCallWithDetails,
  InitiateOutboundCallRequest,
  InitiateOutboundCallResponse 
} from '@/features/elevenlabs/types/outboundCall';
import { queryKeys } from '@/lib/queryKeys';

interface UseOutboundCallsOptions {
  applicationId?: string;
  organizationId?: string;
  enabled?: boolean;
}

export const useOutboundCalls = (options: UseOutboundCallsOptions = {}) => {
  const { applicationId, organizationId, enabled = true } = options;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch outbound calls
  const { data: outboundCalls, isLoading, error } = useQuery({
    queryKey: applicationId ? queryKeys.outboundCalls.byApplication(applicationId) : queryKeys.outboundCalls.byOrganization(organizationId),
    queryFn: async (): Promise<OutboundCallWithDetails[]> => {
      let query = supabase
        .from('outbound_calls')
        .select(`
          *,
          voice_agent:voice_agents!outbound_calls_voice_agent_id_fkey(id, name),
          application:applications!outbound_calls_application_id_fkey(id, first_name, last_name, phone)
        `)
        .order('created_at', { ascending: false });

      if (applicationId) {
        query = query.eq('application_id', applicationId);
      }
      
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return (data || []) as unknown as OutboundCallWithDetails[];
    },
    enabled: enabled,
  });

  // Initiate outbound call mutation
  const initiateCallMutation = useMutation({
    mutationFn: async (request: InitiateOutboundCallRequest): Promise<InitiateOutboundCallResponse> => {
      const { data, error } = await supabase.functions.invoke('elevenlabs-outbound-call', {
        body: request,
      });

      if (error) throw error;
      return data as InitiateOutboundCallResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['outbound-calls'] });
      toast({
        title: 'Call Initiated',
        description: data.message || 'Outbound call has been initiated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Call Failed',
        description: error.message || 'Failed to initiate outbound call.',
        variant: 'destructive',
      });
    },
  });

  // Process queued calls
  const processQueuedCallMutation = useMutation({
    mutationFn: async (outboundCallId: string): Promise<InitiateOutboundCallResponse> => {
      const { data, error } = await supabase.functions.invoke('elevenlabs-outbound-call', {
        body: { outbound_call_id: outboundCallId },
      });

      if (error) throw error;
      return data as InitiateOutboundCallResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['outbound-calls'] });
      toast({
        title: 'Queued Call Processed',
        description: data.message || 'Queued call has been processed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Processing Failed',
        description: error.message || 'Failed to process queued call.',
        variant: 'destructive',
      });
    },
  });

  // Cancel a queued call
  const cancelCallMutation = useMutation({
    mutationFn: async (callId: string) => {
      const { error } = await supabase
        .from('outbound_calls')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', callId)
        .eq('status', 'queued');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-calls'] });
      toast({
        title: 'Call Cancelled',
        description: 'The queued call has been cancelled.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'Failed to cancel the call.',
        variant: 'destructive',
      });
    },
  });

  return {
    outboundCalls: outboundCalls || [],
    isLoading,
    error,
    initiateCall: initiateCallMutation.mutate,
    initiateCallAsync: initiateCallMutation.mutateAsync,
    isInitiating: initiateCallMutation.isPending,
    processQueuedCall: processQueuedCallMutation.mutate,
    isProcessing: processQueuedCallMutation.isPending,
    cancelCall: cancelCallMutation.mutate,
    isCancelling: cancelCallMutation.isPending,
  };
};
