import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Calendar, GripVertical, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Application } from '@/types/common.types';
import { cn } from '@/lib/utils';

interface KanbanCardProps {
  application: Application;
  onClick?: () => void;
  isDragging?: boolean;
  isUpdating?: boolean;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  application,
  onClick,
  isDragging = false,
  isUpdating = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: application.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getApplicantName = () => {
    if (application.first_name && application.last_name) {
      return `${application.first_name} ${application.last_name}`;
    }
    return application.first_name || application.last_name || 'Anonymous';
  };

  const getLocation = () => {
    const parts = [application.city, application.state].filter(Boolean);
    return parts.join(', ') || null;
  };

  const getJobTitle = () => {
    return (
      application.job_listings?.title ||
      application.job_listings?.job_title ||
      'No position'
    );
  };

  const appliedDate = application.applied_at || application.created_at;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'p-3 cursor-pointer transition-all hover:shadow-md group',
        (isDragging || isSortableDragging) && 'opacity-50 shadow-lg rotate-2 scale-105',
        isUpdating && 'pointer-events-none opacity-70'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Applicant Name */}
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="font-medium text-sm truncate">{getApplicantName()}</span>
            {isUpdating && <Loader2 className="h-3 w-3 animate-spin" />}
          </div>

          {/* Job Title */}
          <p className="text-xs text-muted-foreground truncate">{getJobTitle()}</p>

          {/* Location */}
          {getLocation() && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{getLocation()}</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            {/* Source Badge */}
            {application.source && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                {application.source}
              </Badge>
            )}

            {/* Applied Date */}
            {appliedDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                <Calendar className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(appliedDate), { addSuffix: true })}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default KanbanCard;
