import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryKeys';
import { logger } from '@/lib/logger';
import type { Json } from '@/integrations/supabase/types';

export interface CommunicationLog {
  id: string;
  organization_id: string;
  application_id: string | null;
  channel: 'email' | 'sms' | 'call';
  direction: 'outbound' | 'inbound';
  recipient: string;
  subject: string | null;
  body_preview: string | null;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  external_id: string | null;
  metadata: Record<string, unknown>;
  sent_by: string | null;
  sent_at: string;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
}

async function fetchCommunicationLogs(applicationId: string): Promise<CommunicationLog[]> {
  const { data, error } = await supabase
    .from('communication_logs')
    .select('*')
    .eq('application_id', applicationId)
    .order('sent_at', { ascending: false });

  if (error) throw error;
  return (data || []) as CommunicationLog[];
}

export function useCommunicationLogs(applicationId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const logsQuery = useQuery({
    queryKey: queryKeys.communications.logs(applicationId || ''),
    queryFn: () => fetchCommunicationLogs(applicationId!),
    enabled: !!applicationId,
  });

  const logCommunicationMutation = useMutation({
    mutationFn: async (params: {
      applicationId: string;
      organizationId: string;
      channel: 'email' | 'sms' | 'call';
      direction: 'outbound' | 'inbound';
      recipient: string;
      subject?: string;
      bodyPreview?: string;
      externalId?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('communication_logs')
        .insert([{
          application_id: params.applicationId,
          organization_id: params.organizationId,
          channel: params.channel,
          direction: params.direction,
          recipient: params.recipient,
          subject: params.subject || null,
          body_preview: params.bodyPreview || null,
          external_id: params.externalId || null,
          metadata: (params.metadata || {}) as Json,
          sent_by: userData?.user?.id || null,
          status: 'sent',
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communications.logs(applicationId || '') });
    },
    onError: (error) => {
      logger.error('Error logging communication', error, { context: 'useCommunicationLogs' });
    },
  });

  return {
    logs: logsQuery.data || [],
    isLoading: logsQuery.isLoading,
    error: logsQuery.error,
    logCommunication: logCommunicationMutation.mutateAsync,
    isLogging: logCommunicationMutation.isPending,
    refetch: logsQuery.refetch,
  };
}

/**
 * Hook to get communication statistics for an application
 */
export function useCommunicationStats(applicationId: string | undefined) {
  const { logs, isLoading } = useCommunicationLogs(applicationId);

  const stats = {
    totalEmails: logs.filter(l => l.channel === 'email').length,
    totalSms: logs.filter(l => l.channel === 'sms').length,
    totalCalls: logs.filter(l => l.channel === 'call').length,
    delivered: logs.filter(l => l.status === 'delivered').length,
    opened: logs.filter(l => l.status === 'opened').length,
    clicked: logs.filter(l => l.status === 'clicked').length,
    failed: logs.filter(l => l.status === 'failed' || l.status === 'bounced').length,
  };

  return { stats, isLoading };
}
