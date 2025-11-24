/**
 * Consolidated Bulk Actions Hook
 * Manages selection state and bulk operations with progress tracking
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { ApplicationStatus, BulkActionProgress } from '@/types/api.types';

interface BulkActionsOptions {
  updateApplication: (id: string, data: { status: ApplicationStatus }) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useApplicationsBulkActions = ({ updateApplication, refresh }: BulkActionsOptions) => {
  const { toast } = useToast();
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [bulkProgress, setBulkProgress] = useState<BulkActionProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    status: 'pending',
  });

  const handleSelectAll = useCallback((checked: boolean, applicationIds: string[]) => {
    if (checked) {
      setSelectedApplications(new Set(applicationIds));
    } else {
      setSelectedApplications(new Set());
    }
  }, []);

  const handleSelectApplication = useCallback((id: string, checked: boolean) => {
    setSelectedApplications(prev => {
      const newSelected = new Set(prev);
      if (checked) {
        newSelected.add(id);
      } else {
        newSelected.delete(id);
      }
      return newSelected;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedApplications(new Set());
  }, []);

  const handleBulkStatusChange = useCallback(
    async (newStatus: ApplicationStatus) => {
      const ids = Array.from(selectedApplications);
      if (ids.length === 0) {
        toast({
          title: 'No Selection',
          description: 'Please select applications first',
          variant: 'destructive',
        });
        return;
      }

      setBulkProgress({
        current: 0,
        total: ids.length,
        percentage: 0,
        status: 'processing',
      });

      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < ids.length; i++) {
        try {
          await updateApplication(ids[i], { status: newStatus });
          successCount++;
        } catch (error) {
          console.error(`Failed to update application ${ids[i]}:`, error);
          failureCount++;
        }

        setBulkProgress({
          current: i + 1,
          total: ids.length,
          percentage: Math.round(((i + 1) / ids.length) * 100),
          status: 'processing',
        });
      }

      setBulkProgress({
        current: ids.length,
        total: ids.length,
        percentage: 100,
        status: failureCount > 0 ? 'failed' : 'completed',
      });

      if (failureCount === 0) {
        toast({
          title: 'Bulk Update Complete',
          description: `Successfully updated ${successCount} application${successCount === 1 ? '' : 's'}`,
        });
      } else {
        toast({
          title: 'Bulk Update Partially Failed',
          description: `Updated ${successCount}, failed ${failureCount}`,
          variant: 'destructive',
        });
      }

      await refresh();
      clearSelection();

      // Reset progress after 2 seconds
      setTimeout(() => {
        setBulkProgress({
          current: 0,
          total: 0,
          percentage: 0,
          status: 'pending',
        });
      }, 2000);
    },
    [selectedApplications, updateApplication, refresh, clearSelection, toast]
  );

  const handleBulkDelete = useCallback(
    async (deleteFunction: (id: string) => Promise<void>) => {
      const ids = Array.from(selectedApplications);
      if (ids.length === 0) {
        toast({
          title: 'No Selection',
          description: 'Please select applications first',
          variant: 'destructive',
        });
        return;
      }

      // Confirm deletion
      if (!window.confirm(`Are you sure you want to delete ${ids.length} application${ids.length === 1 ? '' : 's'}?`)) {
        return;
      }

      setBulkProgress({
        current: 0,
        total: ids.length,
        percentage: 0,
        status: 'processing',
      });

      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < ids.length; i++) {
        try {
          await deleteFunction(ids[i]);
          successCount++;
        } catch (error) {
          console.error(`Failed to delete application ${ids[i]}:`, error);
          failureCount++;
        }

        setBulkProgress({
          current: i + 1,
          total: ids.length,
          percentage: Math.round(((i + 1) / ids.length) * 100),
          status: 'processing',
        });
      }

      setBulkProgress({
        current: ids.length,
        total: ids.length,
        percentage: 100,
        status: failureCount > 0 ? 'failed' : 'completed',
      });

      if (failureCount === 0) {
        toast({
          title: 'Bulk Delete Complete',
          description: `Successfully deleted ${successCount} application${successCount === 1 ? '' : 's'}`,
        });
      } else {
        toast({
          title: 'Bulk Delete Partially Failed',
          description: `Deleted ${successCount}, failed ${failureCount}`,
          variant: 'destructive',
        });
      }

      await refresh();
      clearSelection();

      setTimeout(() => {
        setBulkProgress({
          current: 0,
          total: 0,
          percentage: 0,
          status: 'pending',
        });
      }, 2000);
    },
    [selectedApplications, refresh, clearSelection, toast]
  );

  return {
    selectedApplications,
    handleSelectAll,
    handleSelectApplication,
    clearSelection,
    handleBulkStatusChange,
    handleBulkDelete,
    bulkProgress,
    hasSelection: selectedApplications.size > 0,
    selectionCount: selectedApplications.size,
  };
};
