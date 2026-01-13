import React, { useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { useKanbanBoard, KANBAN_COLUMNS } from '../hooks/useKanbanBoard';
import type { Application } from '@/types/common.types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface KanbanBoardProps {
  applications: Application[];
  onStatusChange: (id: string, newStatus: string) => Promise<void>;
  onApplicationClick: (application: Application) => void;
  isUpdating?: boolean;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  applications,
  onStatusChange,
  onApplicationClick,
  isUpdating = false,
}) => {
  const {
    activeId,
    handleDragStart,
    handleDragEnd,
    getApplicationById,
  } = useKanbanBoard({ applications, onStatusChange });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group applications by status
  const applicationsByStatus = useMemo(() => {
    const grouped: Record<string, Application[]> = {};
    
    KANBAN_COLUMNS.forEach((col) => {
      grouped[col.id] = [];
    });

    applications.forEach((app) => {
      const status = app.status || 'pending';
      if (grouped[status]) {
        grouped[status].push(app);
      } else {
        // Put unknown statuses in pending
        grouped['pending'].push(app);
      }
    });

    return grouped;
  }, [applications]);

  const activeApplication = activeId ? getApplicationById(activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {KANBAN_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              label={column.label}
              color={column.color}
              applications={applicationsByStatus[column.id] || []}
              onApplicationClick={onApplicationClick}
              isUpdating={isUpdating}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <DragOverlay>
        {activeApplication ? (
          <KanbanCard
            application={activeApplication}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
