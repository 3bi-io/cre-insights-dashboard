import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowRightLeft,
  MessageSquare,
  Mail,
  Phone,
  FileText,
  Shield,
  RefreshCw,
  UserPlus,
  CalendarClock,
  Send,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CandidateActivity } from '../hooks/useApplicationActivities';

interface ActivityItemProps {
  activity: CandidateActivity;
  isFirst?: boolean;
  isLast?: boolean;
}

const ACTIVITY_CONFIG: Record<
  string,
  { icon: React.ElementType; bgColor: string; iconColor: string }
> = {
  status_change: {
    icon: ArrowRightLeft,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  note_added: {
    icon: MessageSquare,
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  email_sent: {
    icon: Mail,
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  sms_sent: {
    icon: MessageSquare,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  call_made: {
    icon: Phone,
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  document_uploaded: {
    icon: FileText,
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  screening_initiated: {
    icon: Shield,
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  ats_synced: {
    icon: RefreshCw,
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  application_created: {
    icon: UserPlus,
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  recruiter_assigned: {
    icon: UserPlus,
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  interview_scheduled: {
    icon: CalendarClock,
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  offer_sent: {
    icon: Send,
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
  background_check: {
    icon: CheckCircle,
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
};

const DEFAULT_CONFIG = {
  icon: Clock,
  bgColor: 'bg-gray-100 dark:bg-gray-800',
  iconColor: 'text-gray-600 dark:text-gray-400',
};

export const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  isFirst = false,
  isLast = false,
}) => {
  const config = ACTIVITY_CONFIG[activity.activity_type] || DEFAULT_CONFIG;
  const Icon = config.icon;

  const formattedTime = formatDistanceToNow(new Date(activity.created_at), {
    addSuffix: true,
  });

  return (
    <div className="relative flex gap-3 pl-1">
      {/* Icon */}
      <div
        className={cn(
          'relative z-10 flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0',
          config.bgColor
        )}
      >
        <Icon className={cn('h-4 w-4', config.iconColor)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground leading-tight">
            {activity.title}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
            {formattedTime}
          </span>
        </div>

        {activity.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {activity.description}
          </p>
        )}

        {/* Metadata badges */}
        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {activity.metadata.old_status && activity.metadata.new_status && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted">
                <span className="text-muted-foreground">
                  {String(activity.metadata.old_status)}
                </span>
                <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{String(activity.metadata.new_status)}</span>
              </span>
            )}
            {activity.metadata.source && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                via {String(activity.metadata.source)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityItem;
