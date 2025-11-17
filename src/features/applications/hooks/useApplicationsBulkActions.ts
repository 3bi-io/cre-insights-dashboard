import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { Application } from '@/types/common.types';

/**
 * Hook for handling bulk application actions (select, status change, delete)
 * Extracted from ApplicationsPage for better maintainability
 */
export const useApplicationsBulkActions = (
  applications: Application[],
  updateApplication: (id: string, data: Record<string, unknown>) => void,
  deleteApplication: () => void
) => {
  const { toast } = useToast();
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());

  const handleSelectAll = useCallback(() => {
    if (selectedApplications.size === applications.length) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(new Set(applications.map(app => app.id)));
    }
  }, [applications, selectedApplications.size]);

  const handleSelectApplication = useCallback((id: string) => {
    setSelectedApplications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleBulkStatusChange = useCallback(async (status: string) => {
    const selectedIds = Array.from(selectedApplications);
    try {
      await Promise.all(
        selectedIds.map(id => updateApplication(id, { status }))
      );
      toast({
        title: "Status Updated",
        description: `${selectedIds.length} application(s) updated to ${status}`,
      });
      setSelectedApplications(new Set());
    } catch (error) {
      logger.error('Bulk status change error', error, 'Applications');
      toast({
        title: "Update Failed",
        description: "Failed to update application statuses",
        variant: "destructive",
      });
    }
  }, [selectedApplications, updateApplication, toast]);

  const handleBulkDelete = useCallback(() => {
    // Delete not supported for compliance - applications maintain audit trail
    deleteApplication();
    setSelectedApplications(new Set());
  }, [deleteApplication]);

  const clearSelection = useCallback(() => {
    setSelectedApplications(new Set());
  }, []);

  return {
    selectedApplications,
    handleSelectAll,
    handleSelectApplication,
    handleBulkStatusChange,
    handleBulkDelete,
    clearSelection,
  };
};
