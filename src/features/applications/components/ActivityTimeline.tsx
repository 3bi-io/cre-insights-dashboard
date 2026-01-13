import React from 'react';
import { useApplicationActivities } from '../hooks/useApplicationActivities';
import { ActivityItem } from './ActivityItem';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, AlertCircle } from 'lucide-react';

interface ActivityTimelineProps {
  applicationId: string;
  maxHeight?: string;
  showTitle?: boolean;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  applicationId,
  maxHeight = '400px',
  showTitle = true,
}) => {
  const { activities, isLoading, error } = useApplicationActivities(applicationId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showTitle && (
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Activity Timeline
          </h4>
        )}
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive text-sm py-4">
        <AlertCircle className="w-4 h-4" />
        <span>Failed to load activity timeline</span>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activity recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showTitle && (
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Activity Timeline ({activities.length})
        </h4>
      )}
      <ScrollArea style={{ maxHeight }} className="pr-4">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />
          
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                isFirst={index === 0}
                isLast={index === activities.length - 1}
              />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ActivityTimeline;
