/**
 * Map Stats Component
 * Displays summary statistics for the job map with accessibility
 */

import { memo } from 'react';
import { MapPin, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  if (isLoading) {
    return (
      <div className="absolute bottom-4 left-4 z-[1000]">
        <div 
          className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-3 animate-pulse"
          aria-busy="true"
          aria-label="Loading map statistics"
        >
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const mappedPercentage = totalJobs > 0 
    ? Math.round((jobsWithLocation / totalJobs) * 100) 
    : 0;

  return (
    <div 
      className="absolute bottom-4 left-4 z-[1000]"
      role="status"
      aria-label="Map statistics"
    >
      <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-3 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <Briefcase className="w-4 h-4 text-primary" aria-hidden="true" />
          <span className="font-medium">{totalJobs.toLocaleString()}</span>
          <span className="text-muted-foreground">
            <span className="sr-only">total</span> jobs
          </span>
        </div>
        
        <div className="w-px h-4 bg-border" aria-hidden="true" />
        
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
          <span className="font-medium">{uniqueLocations}</span>
          <span className="text-muted-foreground">locations</span>
        </div>

        {jobsWithLocation < totalJobs && (
          <>
            <div className="w-px h-4 bg-border" aria-hidden="true" />
            <Badge 
              variant="secondary" 
              className="text-xs"
              aria-label={`${mappedPercentage}% of jobs have map locations`}
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
