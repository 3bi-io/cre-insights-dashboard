import { useQuery, useIsMutating } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';

interface BulkOperation {
  id: string;
  operation_type: string;
  status: string;
  total_records: number;
  processed_records: number;
  failed_records: number;
  file_url: string | null;
  error_log: any;
  metadata: any;
  organization_id: string;
  user_id: string;
  created_at: string;
  completed_at: string | null;
}

interface UseBulkOperationStatusOptions {
  enabled?: boolean;
  pollingInterval?: number;
  onOperationComplete?: (operation: BulkOperation) => void;
}

export function useBulkOperationStatus({
  enabled = true,
  pollingInterval = 10000, // 10 seconds default
  onOperationComplete
}: UseBulkOperationStatusOptions = {}) {
  const { toast } = useToast();
  const previousStatusRef = useRef<Record<string, string>>({});
  const isMutating = useIsMutating();

  const { data: operations, isLoading, error } = useQuery({
    queryKey: ['bulk-operations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenstreet_bulk_operations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as BulkOperation[];
    },
    enabled,
    refetchInterval: (query) => {
      // Pause polling during any active mutations to prevent UI freeze
      if (isMutating > 0) return false;
      // Stop polling if no operations are in progress
      const hasActiveOps = query.state.data?.some(
        (op: BulkOperation) => op.status === 'in_progress'
      );
      return hasActiveOps ? pollingInterval : false;
    },
    refetchIntervalInBackground: true,
    staleTime: 5000, // 5 seconds - reduce unnecessary refetches
  });

  // Detect operation completions and trigger notifications
  useEffect(() => {
    if (!operations) return;

    operations.forEach((operation) => {
      const previousStatus = previousStatusRef.current[operation.id];
      
      if (previousStatus === 'in_progress' && operation.status === 'completed') {
        toast({
          title: 'Bulk Operation Completed',
          description: `${operation.operation_type} processed ${operation.processed_records} records successfully.`,
          variant: 'default'
        });

        if (onOperationComplete) {
          onOperationComplete(operation);
        }
      } else if (previousStatus === 'in_progress' && operation.status === 'failed') {
        const errorCount = operation.failed_records || 0;
        toast({
          title: 'Bulk Operation Failed',
          description: `${operation.operation_type} encountered ${errorCount} errors. Check the logs for details.`,
          variant: 'destructive'
        });

        if (onOperationComplete) {
          onOperationComplete(operation);
        }
      }

      previousStatusRef.current[operation.id] = operation.status;
    });
  }, [operations, toast, onOperationComplete]);

  const activeOperations = operations?.filter(op => op.status === 'in_progress') || [];
  const recentOperations = operations?.slice(0, 5) || [];

  return {
    operations,
    activeOperations,
    recentOperations,
    isLoading,
    error,
    hasActiveOperations: activeOperations.length > 0
  };
}
