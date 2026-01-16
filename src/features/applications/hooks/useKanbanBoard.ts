import { useState, useCallback } from 'react';
import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useQueryClient } from '@tanstack/react-query';
import type { Application } from '@/types/common.types';
import { useLogActivity } from './useApplicationActivities';
import { logger } from '@/lib/logger';

export interface KanbanColumn {
  id: string;
  label: string;
  color: string;
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'pending', label: 'New', color: 'bg-blue-500' },
  { id: 'reviewed', label: 'Reviewed', color: 'bg-yellow-500' },
  { id: 'interviewed', label: 'Interview', color: 'bg-purple-500' },
  { id: 'hired', label: 'Hired', color: 'bg-green-500' },
  { id: 'rejected', label: 'Rejected', color: 'bg-gray-500' },
];

interface UseKanbanBoardOptions {
  applications: Application[];
  onStatusChange: (id: string, newStatus: string) => Promise<void>;
}

export function useKanbanBoard({ applications, onStatusChange }: UseKanbanBoardOptions) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const getApplicationById = useCallback(
    (id: string) => applications.find((app) => app.id === id),
    [applications]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const applicationId = active.id as string;
      const newStatus = over.id as string;

      // Find the application and its current status
      const application = getApplicationById(applicationId);
      if (!application) return;

      const currentStatus = application.status || 'pending';

      // Don't do anything if dropped in the same column
      if (currentStatus === newStatus) return;

      // Validate that it's a valid column
      const isValidColumn = KANBAN_COLUMNS.some((col) => col.id === newStatus);
      if (!isValidColumn) return;

      setIsProcessing(true);

      try {
        // Optimistic update
        queryClient.setQueryData<Application[]>(
          ['applications'],
          (old) =>
            old?.map((app) =>
              app.id === applicationId ? { ...app, status: newStatus } : app
            ) || []
        );

        await onStatusChange(applicationId, newStatus);
      } catch (error) {
        // Revert on error
        queryClient.invalidateQueries({ queryKey: ['applications'] });
        logger.error('Failed to update status:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [getApplicationById, onStatusChange, queryClient]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  return {
    activeId,
    isProcessing,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    getApplicationById,
  };
}
