/**
 * Empty State Illustration Component
 * Engaging illustrations for empty states with actionable CTAs
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Briefcase, 
  FileText, 
  Heart, 
  Inbox,
  Truck,
  Users,
  Calendar,
  type LucideIcon
} from 'lucide-react';

type EmptyStateType = 
  | 'no-jobs'
  | 'no-applications'
  | 'no-saved'
  | 'no-results'
  | 'no-messages'
  | 'no-drivers'
  | 'no-interviews'
  | 'generic';

interface EmptyStateIllustrationProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const emptyStateConfigs: Record<EmptyStateType, {
  icon: LucideIcon;
  defaultTitle: string;
  defaultDescription: string;
  color: string;
}> = {
  'no-jobs': {
    icon: Briefcase,
    defaultTitle: 'No jobs found',
    defaultDescription: 'Try adjusting your search filters or check back later for new opportunities.',
    color: 'text-primary',
  },
  'no-applications': {
    icon: FileText,
    defaultTitle: 'No applications yet',
    defaultDescription: 'Start your journey by applying to jobs that match your skills.',
    color: 'text-secondary',
  },
  'no-saved': {
    icon: Heart,
    defaultTitle: 'No saved jobs',
    defaultDescription: 'Save jobs you\'re interested in to review them later.',
    color: 'text-destructive',
  },
  'no-results': {
    icon: Search,
    defaultTitle: 'No results found',
    defaultDescription: 'We couldn\'t find anything matching your search. Try different keywords.',
    color: 'text-muted-foreground',
  },
  'no-messages': {
    icon: Inbox,
    defaultTitle: 'No messages',
    defaultDescription: 'Your inbox is empty. Messages from recruiters will appear here.',
    color: 'text-info',
  },
  'no-drivers': {
    icon: Truck,
    defaultTitle: 'No drivers found',
    defaultDescription: 'There are no drivers matching your current filters.',
    color: 'text-primary',
  },
  'no-interviews': {
    icon: Calendar,
    defaultTitle: 'No scheduled interviews',
    defaultDescription: 'When interviews are scheduled, they\'ll appear here.',
    color: 'text-success',
  },
  'generic': {
    icon: Users,
    defaultTitle: 'Nothing here yet',
    defaultDescription: 'Check back later or try a different action.',
    color: 'text-muted-foreground',
  },
};

export const EmptyStateIllustration: React.FC<EmptyStateIllustrationProps> = ({
  type = 'generic',
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
  size = 'md',
}) => {
  const config = emptyStateConfigs[type];
  const Icon = config.icon;

  const sizes = {
    sm: {
      container: 'py-8',
      iconWrapper: 'w-16 h-16',
      icon: 'w-8 h-8',
      title: 'text-lg',
      description: 'text-sm',
    },
    md: {
      container: 'py-12',
      iconWrapper: 'w-20 h-20',
      icon: 'w-10 h-10',
      title: 'text-xl',
      description: 'text-base',
    },
    lg: {
      container: 'py-16',
      iconWrapper: 'w-24 h-24',
      icon: 'w-12 h-12',
      title: 'text-2xl',
      description: 'text-lg',
    },
  };

  const sizeConfig = sizes[size];

  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center text-center px-4',
        sizeConfig.container,
        className
      )}
    >
      {/* Animated Icon */}
      <div 
        className={cn(
          'relative flex items-center justify-center rounded-full bg-muted mb-6',
          sizeConfig.iconWrapper
        )}
      >
        {/* Decorative rings */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-muted-foreground/20 animate-[spin_20s_linear_infinite]" />
        <div className="absolute inset-2 rounded-full border border-muted-foreground/10" />
        
        <Icon 
          className={cn(
            'relative z-10 transition-transform hover:scale-110',
            sizeConfig.icon,
            config.color
          )} 
        />
      </div>

      {/* Title */}
      <h3 
        className={cn(
          'font-semibold text-foreground mb-2',
          sizeConfig.title
        )}
      >
        {title || config.defaultTitle}
      </h3>

      {/* Description */}
      <p 
        className={cn(
          'text-muted-foreground max-w-sm mb-6',
          sizeConfig.description
        )}
      >
        {description || config.defaultDescription}
      </p>

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {actionLabel && onAction && (
            <Button onClick={onAction} className="min-h-[44px]">
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button 
              variant="outline" 
              onClick={onSecondaryAction}
              className="min-h-[44px]"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyStateIllustration;
