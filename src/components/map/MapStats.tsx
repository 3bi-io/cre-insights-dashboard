/**
 * Enhanced Map Stats Component
 * Responsive stats display with collapsible mobile view
 */

import { memo, useState } from 'react';
import { MapPin, Briefcase, ChevronUp, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/design-system/Button';
import { useMapContextOptional } from './MapContext';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MapStatsProps {
  totalJobs: number;
  uniqueLocations: number;
  jobsWithLocation: number;
  isLoading?: boolean;
}

export const MapStats = memo(function MapStats({
  totalJobs,
  uniqueLocations,
  jobsWithLocation,
  isLoading,
}: MapStatsProps) {
  const mapContext = useMapContextOptional();
  const isMobileFallback = useIsMobile();
  const isMobile = mapContext?.isMobile ?? isMobileFallback;
  
  // Mobile: Collapsible stats
  const [isExpanded, setIsExpanded] = useState(false);
  
  const mappedPercentage = totalJobs > 0 
    ? Math.round((jobsWithLocation / totalJobs) * 100)
    : 100;

  if (isLoading) {
    return (
      <div 
        className={cn(
          "absolute z-[1000] bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border",
          "animate-pulse",
          // Mobile: bottom-left, compact
          isMobile ? "bottom-4 left-4 p-2" : "bottom-4 left-4 p-3"
        )}
        aria-busy="true"
        aria-label="Loading job statistics"
      >
        <div className={cn(
          "bg-muted rounded",
          isMobile ? "h-6 w-20" : "h-16 w-40"
        )} />
      </div>
    );
  }

  // Mobile: Compact collapsible view
  if (isMobile) {
    return (
      <div 
        className="absolute bottom-4 left-4 z-[1000]"
        role="status"
        aria-label="Job statistics"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-background/95 backdrop-blur-sm shadow-lg h-10 px-3 gap-2"
          aria-expanded={isExpanded}
          aria-controls="mobile-stats-panel"
        >
          <Briefcase className="w-4 h-4 text-primary" aria-hidden="true" />
          <span className="font-semibold">{totalJobs}</span>
          <span className="text-muted-foreground text-xs">jobs</span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 ml-1" aria-hidden="true" />
          ) : (
            <ChevronUp className="w-4 h-4 ml-1" aria-hidden="true" />
          )}
        </Button>
        
        {isExpanded && (
          <div 
            id="mobile-stats-panel"
            className="absolute bottom-12 left-0 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border p-3 min-w-[160px]"
          >
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  Locations
                </span>
                <span className="font-medium">{uniqueLocations}</span>
              </div>
              
              {jobsWithLocation < totalJobs && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Mapped</span>
                  <Badge 
                    variant={mappedPercentage >= 80 ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {mappedPercentage}%
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Tablet/Desktop: Full stats display
  return (
    <div 
      className="absolute bottom-4 left-4 z-[1000] bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border p-3"
      role="status"
      aria-label="Job statistics"
    >
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <Briefcase className="w-4 h-4 text-primary" aria-hidden="true" />
          <span className="font-semibold">{totalJobs}</span>
          <span className="text-muted-foreground">jobs</span>
        </div>
        
        <div className="w-px h-4 bg-border" aria-hidden="true" />
        
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <span className="font-semibold">{uniqueLocations}</span>
          <span className="text-muted-foreground">locations</span>
        </div>
        
        {jobsWithLocation < totalJobs && (
          <>
            <div className="w-px h-4 bg-border" aria-hidden="true" />
            <Badge 
              variant={mappedPercentage >= 80 ? 'default' : 'secondary'}
              className="text-xs"
            >
              {mappedPercentage}% mapped
            </Badge>
          </>
        )}
      </div>
    </div>
  );
});

export default MapStats;
