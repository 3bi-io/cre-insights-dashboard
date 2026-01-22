/**
 * Bulk Operations Hook
 * Manages Tenstreet bulk import/export/sync operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TenstreetService } from '@/features/platforms/services';
import { queryKeys } from '@/lib/queryKeys';

export interface BulkOperation {
  id: string;
  organization_id: string;
  user_id: string;
  operation_type: 'import' | 'export' | 'status_update' | 'sync_facebook' | 'sync_hubspot';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_records: number;
  processed_records: number;
  failed_records: number;
  success_records: number;
  file_url?: string;
  error_log: any[];
  metadata: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

interface SyncData {
  source: 'facebook' | 'hubspot';
  companyId: string;
  adAccountId?: string;
  credentials?: any;
}

export function useBulkOperations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all bulk operations
  const { data: operations, isLoading } = useQuery({
    queryKey: queryKeys.tenstreet.bulkOperations,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenstreet_bulk_operations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BulkOperation[];
    }
  });

  // Create bulk import operation
  const importMutation = useMutation({
    mutationFn: async (data: { file: File; mappings: Record<string, string>; companyId: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user?.id)
        .single();

      const { data: operation, error: opError } = await supabase
        .from('tenstreet_bulk_operations')
        .insert({
          organization_id: profile?.organization_id,
          user_id: user.user?.id,
          operation_type: 'import',
          status: 'processing',
          metadata: { mappings: data.mappings }
        })
        .select()
        .single();

      if (opError) throw opError;

      const result = await TenstreetService.bulkImport('csv_upload', [], data.companyId);
      
      await supabase
        .from('tenstreet_bulk_operations')
        .update({
          status: result.success ? 'completed' : 'failed',
          total_records: result.data?.imported || 0,
          success_records: result.data?.imported || 0,
          failed_records: result.data?.failed || 0,
          error_log: result.data?.errors || [],
          completed_at: new Date().toISOString()
        })
        .eq('id', operation.id);

      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Import Started',
        description: 'Bulk import operation has been initiated'
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenstreet.bulkOperations });
    },
    onError: (error: Error) => {
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Create bulk export operation
  const exportMutation = useMutation({
    mutationFn: async (criteria: { format: string; filters?: Record<string, any>; companyId: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user?.id)
        .single();

      const { data: operation, error: opError } = await supabase
        .from('tenstreet_bulk_operations')
        .insert({
          organization_id: profile?.organization_id,
          user_id: user.user?.id,
          operation_type: 'export',
          status: 'processing',
          metadata: criteria
        })
        .select()
        .single();

      if (opError) throw opError;

      const result = await TenstreetService.bulkExport({
        companyId: criteria.companyId,
        format: criteria.format as any,
        ...criteria.filters
      });

      if (result.success && result.data) {
        const blob = result.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_${Date.now()}.${criteria.format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      await supabase
        .from('tenstreet_bulk_operations')
        .update({
          status: result.success ? 'completed' : 'failed',
          total_records: 0,
          completed_at: new Date().toISOString()
        })
        .eq('id', operation.id);

      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Export Completed',
        description: 'Data exported successfully'
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenstreet.bulkOperations });
    },
    onError: (error: Error) => {
      toast({
        title: 'Export Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Bulk status update
  const statusUpdateMutation = useMutation({
    mutationFn: async (data: { applicantIds: string[]; status: string; companyId: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user?.id)
        .single();

      const { data: operation, error: opError } = await supabase
        .from('tenstreet_bulk_operations')
        .insert({
          organization_id: profile?.organization_id,
          user_id: user.user?.id,
          operation_type: 'status_update',
          status: 'processing',
          total_records: data.applicantIds.length,
          metadata: { status: data.status }
        })
        .select()
        .single();

      if (opError) throw opError;

      const result = await TenstreetService.bulkStatusUpdate(data.applicantIds, data.status, data.companyId);

      await supabase
        .from('tenstreet_bulk_operations')
        .update({
          status: result.success ? 'completed' : 'failed',
          success_records: result.data?.updated || 0,
          failed_records: result.data?.failed || 0,
          error_log: result.data?.errors || [],
          completed_at: new Date().toISOString()
        })
        .eq('id', operation.id);

      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Status Updated',
        description: 'Bulk status update completed'
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenstreet.bulkOperations });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Sync operations
  const syncMutation = useMutation({
    mutationFn: async (data: SyncData) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user?.id)
        .single();

      const operationType = data.source === 'facebook' ? 'sync_facebook' : 'sync_hubspot';

      const { data: operation, error: opError } = await supabase
        .from('tenstreet_bulk_operations')
        .insert({
          organization_id: profile?.organization_id,
          user_id: user.user?.id,
          operation_type: operationType,
          status: 'processing'
        })
        .select()
        .single();

      if (opError) throw opError;

      const result = data.source === 'facebook' 
        ? await TenstreetService.syncFromFacebook(data.adAccountId || '', data.companyId)
        : await TenstreetService.syncFromHubSpot(data.credentials || {}, data.companyId);

      await supabase
        .from('tenstreet_bulk_operations')
        .update({
          status: result.success ? 'completed' : 'failed',
          total_records: result.data?.synced || 0,
          success_records: result.data?.newApplicants || 0,
          failed_records: 0,
          completed_at: new Date().toISOString()
        })
        .eq('id', operation.id);

      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Sync Completed',
        description: 'Data synchronized successfully'
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenstreet.bulkOperations });
    },
    onError: (error: Error) => {
      toast({
        title: 'Sync Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return {
    operations: operations || [],
    isLoading,
    importData: importMutation.mutate,
    exportData: exportMutation.mutate,
    updateStatus: statusUpdateMutation.mutate,
    syncData: syncMutation.mutate,
    isImporting: importMutation.isPending,
    isExporting: exportMutation.isPending,
    isUpdating: statusUpdateMutation.isPending,
    isSyncing: syncMutation.isPending
  };
}
