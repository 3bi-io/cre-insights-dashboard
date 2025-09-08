import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface MemoizedCardProps {
  id: string;
  title: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  actions?: React.ReactNode;
  metadata?: Record<string, any>;
  onClick?: (id: string) => void;
  className?: string;
  priority?: boolean;
}

const MemoizedCard = React.memo<MemoizedCardProps>(({
  id,
  title,
  description,
  status,
  createdAt,
  updatedAt,
  tags = [],
  actions,
  metadata,
  onClick,
  className = '',
  priority = false,
}) => {
  // Memoized formatted dates
  const formattedDates = useMemo(() => {
    const created = createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : null;
    const updated = updatedAt ? formatDistanceToNow(new Date(updatedAt), { addSuffix: true }) : null;
    
    return { created, updated };
  }, [createdAt, updatedAt]);

  // Memoized status variant
  const statusVariant = useMemo(() => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'published':
      case 'live':
        return 'default';
      case 'pending':
      case 'draft':
        return 'secondary';
      case 'inactive':
      case 'archived':
        return 'outline';
      case 'error':
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  }, [status]);

  // Memoized click handler
  const handleClick = useMemo(() => {
    return onClick ? () => onClick(id) : undefined;
  }, [onClick, id]);

  // Memoized rendered tags
  const renderedTags = useMemo(() => 
    tags.slice(0, 3).map((tag, index) => (
      <Badge key={`${id}-tag-${index}`} variant="outline" className="text-xs">
        {tag}
      </Badge>
    )),
    [tags, id]
  );

  return (
    <Card 
      className={`
        transition-all duration-200 hover:shadow-md
        ${onClick ? 'cursor-pointer hover:bg-muted/50' : ''}
        ${priority ? 'ring-2 ring-primary ring-opacity-20' : ''}
        ${className}
      `}
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {title}
          </CardTitle>
          {status && (
            <Badge variant={statusVariant} className="shrink-0">
              {status}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {description}
          </p>
        )}
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {renderedTags}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        {metadata && Object.keys(metadata).length > 0 && (
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            {Object.entries(metadata).slice(0, 4).map(([key, value]) => (
              <div key={`${id}-meta-${key}`} className="flex justify-between">
                <span className="font-medium">{key}:</span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        )}
        
        {(formattedDates.created || formattedDates.updated) && (
          <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
            {formattedDates.created && (
              <span>Created {formattedDates.created}</span>
            )}
            {formattedDates.updated && (
              <span>Updated {formattedDates.updated}</span>
            )}
          </div>
        )}
        
        {actions && (
          <div className="flex gap-2 pt-2 border-t">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for optimal re-rendering
  return (
    prevProps.id === nextProps.id &&
    prevProps.title === nextProps.title &&
    prevProps.description === nextProps.description &&
    prevProps.status === nextProps.status &&
    prevProps.createdAt === nextProps.createdAt &&
    prevProps.updatedAt === nextProps.updatedAt &&
    JSON.stringify(prevProps.tags) === JSON.stringify(nextProps.tags) &&
    JSON.stringify(prevProps.metadata) === JSON.stringify(nextProps.metadata) &&
    prevProps.priority === nextProps.priority
  );
});

MemoizedCard.displayName = 'MemoizedCard';

export { MemoizedCard };
export default MemoizedCard;