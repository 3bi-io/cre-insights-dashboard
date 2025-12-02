import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExportParams {
  organizationId: string;
  dateFrom?: string;
  dateTo?: string;
  statuses?: string[];
  jobListingIds?: string[];
  fields: string[];
  format: 'csv' | 'xlsx';
}

interface ExportResponse {
  success: boolean;
  exportData?: string;
  count?: number;
  format?: string;
  message?: string;
}

export function useTenstreetExport() {
  const queryClient = useQueryClient();
  const [exportProgress, setExportProgress] = useState<number>(0);

  const exportMutation = useMutation({
    mutationFn: async (params: ExportParams): Promise<ExportResponse> => {
      const { data, error } = await supabase.functions.invoke('tenstreet-bulk-operations', {
        body: {
          operationType: 'export_organization_data',
          organizationId: params.organizationId,
          filters: {
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
            statuses: params.statuses,
            jobListingIds: params.jobListingIds,
          },
          fieldSelection: params.fields,
          format: params.format,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      if (data.exportData) {
        // Decode base64 and trigger download
        const binaryString = atob(data.exportData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const mimeType =
          variables.format === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv';
        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `tenstreet-export-${new Date().toISOString().split('T')[0]}.${variables.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`Successfully exported ${data.count || 0} records`);
      }

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tenstreet-bulk-operations'] });
    },
    onError: (error: Error) => {
      console.error('Export error:', error);
      toast.error(`Export failed: ${error.message}`);
    },
  });

  return {
    exportOrganizationData: exportMutation.mutateAsync,
    isExporting: exportMutation.isPending,
    exportProgress,
    exportError: exportMutation.error,
  };
}
