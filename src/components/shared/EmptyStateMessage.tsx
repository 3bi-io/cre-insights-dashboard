import React from 'react';
import { LucideIcon, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface EmptyStateMessageProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  variant?: 'default' | 'compact';
}

export const EmptyStateMessage: React.FC<EmptyStateMessageProps> = ({
  icon: Icon = FileQuestion,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
  variant = 'default'
}) => {
  const isCompact = variant === 'compact';

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      isCompact ? "py-6" : "py-12",
      className
    )}>
      <div className={cn(
        "rounded-full bg-muted flex items-center justify-center mb-4",
        isCompact ? "w-12 h-12" : "w-16 h-16"
      )}>
        <Icon className={cn(
          "text-muted-foreground",
          isCompact ? "w-6 h-6" : "w-8 h-8"
        )} />
      </div>
      
      <h3 className={cn(
        "font-semibold text-foreground",
        isCompact ? "text-base" : "text-lg"
      )}>
        {title}
      </h3>
      
      {description && (
        <p className={cn(
          "text-muted-foreground mt-1 max-w-sm",
          isCompact ? "text-xs" : "text-sm"
        )}>
          {description}
        </p>
      )}
      
      {(actionLabel && (actionHref || onAction)) && (
        <div className="mt-4">
          {actionHref ? (
            <Button asChild size={isCompact ? "sm" : "default"}>
              <Link to={actionHref}>{actionLabel}</Link>
            </Button>
          ) : (
            <Button onClick={onAction} size={isCompact ? "sm" : "default"}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyStateMessage;
