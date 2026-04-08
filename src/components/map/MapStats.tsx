/**
 * Enhanced Map Stats Component
 * Shows confidence breakdown and responsive layout
 */

import { memo, useState } from 'react';
import { MapPin, Briefcase, ChevronUp, ChevronDown, Navigation, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/design-system/Button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMapContextOptional } from './MapContext';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MapStatsProps {
  totalJobs: number;
  uniqueLocations: number;
  jobsWithLocation: number;
  exactCount?: number;
  stateCount?: number;
  countryCount?: number;
  isLoading?: boolean;
}

export const MapStats = memo(function MapStats({
  totalJobs,
  uniqueLocations,
  jobsWithLocation,
  exactCount = 0,
  stateCount = 0,
  countryCount = 0,
  isLoading,
}: MapStatsProps) {
  const mapContext = useMapContextOptional();
  const isMobileFallback = useIsMobile();
  const isMobile = mapContext?.isMobile ?? isMobileFallback;
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
          isMobile ? "bottom-4 left-4 p-2" : "bottom-4 left-4 p-3"
        )}
        aria-busy="true"
        aria-label="Loading job statistics"
      >
        <div className={cn("bg-muted rounded", isMobile ? "h-6 w-20" : "h-16 w-40")} />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="absolute bottom-4 left-4 z-[1000]" role="status" aria-label="Job statistics">
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
            className="absolute bottom-12 left-0 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border p-3 min-w-[180px]"
          >
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  Locations
                </span>
                <span className="font-medium">{uniqueLocations}</span>
              </div>
              
              {exactCount > 0 && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                    Exact
                  </span>
                  <span className="font-medium">{exactCount}</span>
                </div>
              )}

              {stateCount > 0 && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                    State area
                  </span>
                  <span className="font-medium">{stateCount}</span>
                </div>
              )}
              
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

  return (
    <TooltipProvider delayDuration={200}>
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

          {/* Confidence breakdown */}
          <div className="w-px h-4 bg-border" aria-hidden="true" />
          
          <div className="flex items-center gap-2">
            {exactCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-default">
                    <Navigation className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                    <span className="font-medium text-xs">{exactCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>Exact city locations</p></TooltipContent>
              </Tooltip>
            )}
            {stateCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-default">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                    <span className="font-medium text-xs">{stateCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>State-level approximations</p></TooltipContent>
              </Tooltip>
            )}
            {countryCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-default">
                    <Globe className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" />
                    <span className="font-medium text-xs">{countryCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>Country-level approximations</p></TooltipContent>
              </Tooltip>
            )}
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
    </TooltipProvider>
  );
});

export default MapStats;
