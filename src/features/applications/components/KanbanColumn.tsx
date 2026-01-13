import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import type { Application } from '@/types/common.types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KanbanColumnProps {
  id: string;
  label: string;
  color: string;
  applications: Application[];
  onApplicationClick?: (application: Application) => void;
  isUpdating?: boolean;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  label,
  color,
  applications,
  onApplicationClick,
  isUpdating = false,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-72 min-w-72 bg-muted/30 rounded-lg border transition-colors',
        isOver && 'ring-2 ring-primary ring-offset-2 bg-muted/50'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <div className={cn('w-3 h-3 rounded-full', color)} />
          <h3 className="font-semibold text-sm">{label}</h3>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {applications.length}
        </span>
      </div>

      {/* Column Content */}
      <ScrollArea className="flex-1 max-h-[calc(100vh-280px)]">
        <SortableContext
          items={applications.map((app) => app.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="p-2 space-y-2 min-h-[100px]">
            {applications.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                No applications
              </div>
            ) : (
              applications.map((application) => (
                <KanbanCard
                  key={application.id}
                  application={application}
                  onClick={() => onApplicationClick?.(application)}
                  isUpdating={isUpdating}
                />
              ))
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
};

export default KanbanColumn;
