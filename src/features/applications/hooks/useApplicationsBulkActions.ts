import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Application } from '@/types/common.types';

export type ApplicationStatus = 'pending' | 'reviewed' | 'interviewing' | 'hired' | 'rejected';

export function useApplicationsBulkActions(
  updateApplication: (id: string, data: Partial<Application>) => void,
  refresh: () => void
) {
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);
  const { toast } = useToast();

  const handleSelectAll = useCallback((checked: boolean, applications: Application[]) => {
    if (checked) {
      setSelectedApplications(new Set(applications.map(app => app.id)));
    } else {
      setSelectedApplications(new Set());
    }
  }, []);

  const handleSelectApplication = useCallback((id: string, checked: boolean) => {
    const newSelected = new Set(selectedApplications);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedApplications(newSelected);
  }, [selectedApplications]);

  const clearSelection = useCallback(() => {
    setSelectedApplications(new Set());
  }, []);

  const handleBulkStatusChange = useCallback(async (status: ApplicationStatus) => {
    const ids = Array.from(selectedApplications);
    
    if (ids.length === 0) {
      toast({
        title: 'No Applications Selected',
        description: 'Please select at least one application',
        variant: 'destructive',
      });
      return;
    }

    setBulkProgress({ current: 0, total: ids.length });
    
    try {
      for (let i = 0; i < ids.length; i++) {
        await updateApplication(ids[i], { status });
        setBulkProgress({ current: i + 1, total: ids.length });
      }
      
      toast({
        title: 'Bulk Update Complete',
        description: `Updated ${ids.length} application${ids.length > 1 ? 's' : ''} to ${status}`,
      });
      
      setSelectedApplications(new Set());
      refresh();
    } catch (error) {
      toast({
        title: 'Bulk Update Failed',
        description: 'Some applications could not be updated',
        variant: 'destructive',
      });
    } finally {
      setBulkProgress(null);
    }
  }, [selectedApplications, updateApplication, refresh, toast]);

  return {
    selectedApplications,
    bulkProgress,
    handleSelectAll,
    handleSelectApplication,
    clearSelection,
    handleBulkStatusChange,
  };
}
