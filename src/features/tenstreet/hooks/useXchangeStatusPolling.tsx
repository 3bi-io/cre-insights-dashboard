/**
 * Xchange Status Polling Hook
 * Polls for status updates on Tenstreet Xchange requests
 */

import { useQuery, useIsMutating } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';

interface XchangeRequest {
  id: string;
  application_id: string;
  driver_id: string;
  request_type: string;
  provider: string | null;
  status: string;
  request_date: string;
  completion_date: string | null;
  result_data: any;
  cost_cents: number;
  reference_number: string | null;
  notes: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

interface UseXchangeStatusPollingOptions {
  applicationId?: string;
  enabled?: boolean;
  pollingInterval?: number;
  onStatusChange?: (request: XchangeRequest) => void;
}

export function useXchangeStatusPolling({
  applicationId,
  enabled = true,
  pollingInterval = 30000,
  onStatusChange
}: UseXchangeStatusPollingOptions) {
  const { toast } = useToast();
  const previousStatusRef = useRef<Record<string, string>>({});
  const isMutating = useIsMutating();

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['xchange-status', applicationId],
    queryFn: async () => {
      if (!applicationId) return [];

      const { data, error } = await supabase
        .from('tenstreet_xchange_requests')
        .select('*')
        .eq('application_id', applicationId)
        .order('request_date', { ascending: false });

      if (error) throw error;
      return data as XchangeRequest[];
    },
    enabled: enabled && !!applicationId,
    refetchInterval: (query) => {
      if (isMutating > 0) return false;
      const allCompleted = query.state.data?.every(
        (req: XchangeRequest) => ['completed', 'failed', 'cancelled'].includes(req.status)
      );
      return allCompleted ? false : pollingInterval;
    },
    refetchIntervalInBackground: true,
    staleTime: 10000,
  });

  // Detect status changes and trigger notifications
  useEffect(() => {
    if (!requests) return;

    requests.forEach((request) => {
      const previousStatus = previousStatusRef.current[request.id];
      
      if (previousStatus && previousStatus !== request.status) {
        const statusMessages: Record<string, { title: string; description: string; variant?: 'default' | 'destructive' }> = {
          completed: {
            title: 'Screening Completed',
            description: `${request.request_type} screening has been completed successfully.`,
            variant: 'default'
          },
          failed: {
            title: 'Screening Failed',
            description: `${request.request_type} screening has failed. Please check the details.`,
            variant: 'destructive'
          },
          in_progress: {
            title: 'Screening In Progress',
            description: `${request.request_type} screening is now being processed.`,
            variant: 'default'
          },
          cancelled: {
            title: 'Screening Cancelled',
            description: `${request.request_type} screening has been cancelled.`,
            variant: 'default'
          }
        };

        const message = statusMessages[request.status];
        if (message) {
          toast({
            title: message.title,
            description: message.description,
            variant: message.variant
          });
        }

        if (onStatusChange) {
          onStatusChange(request);
        }
      }

      previousStatusRef.current[request.id] = request.status;
    });
  }, [requests, toast, onStatusChange]);

  const pendingCount = requests?.filter(r => ['pending', 'in_progress'].includes(r.status)).length || 0;
  const completedCount = requests?.filter(r => r.status === 'completed').length || 0;
  const failedCount = requests?.filter(r => r.status === 'failed').length || 0;

  return {
    requests,
    isLoading,
    error,
    pendingCount,
    completedCount,
    failedCount,
    hasActiveRequests: pendingCount > 0
  };
}
