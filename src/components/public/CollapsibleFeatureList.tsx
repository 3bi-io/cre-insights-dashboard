/**
 * Collapsible Feature List Component
 * For pricing cards - shows limited features with expand option on mobile
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleFeatureListProps {
  features: string[];
  initialCount?: number;
  className?: string;
}

export const CollapsibleFeatureList: React.FC<CollapsibleFeatureListProps> = ({
  features,
  initialCount = 5,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMoreFeatures = features.length > initialCount;
  const displayedFeatures = isExpanded ? features : features.slice(0, initialCount);
  const remainingCount = features.length - initialCount;

  return (
    <div className={cn("space-y-3", className)}>
      <ul className="space-y-3">
        {displayedFeatures.map((feature, index) => (
          <li 
            key={index} 
            className={cn(
              "flex items-start gap-2 transition-opacity duration-200",
              !isExpanded && index >= initialCount && "opacity-0"
            )}
          >
            <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      
      {hasMoreFeatures && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              Show less
              <ChevronUp className="ml-1 h-4 w-4" />
            </>
          ) : (
            <>
              Show {remainingCount} more features
              <ChevronDown className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default CollapsibleFeatureList;
