/**
 * Mobile Job List View
 * Displays all map locations as a scrollable list for mobile users.
 */

import { memo } from 'react';
import { MapPin, Briefcase, Building2, Loader2 } from 'lucide-react';
import { MapLocation } from '@/hooks/useJobMapData';
import { LocationConfidenceBadge } from './LocationConfidenceBadge';
import { cn } from '@/lib/utils';

interface MobileJobListViewProps {
  locations: MapLocation[];
  isLoading: boolean;
  onLocationSelect: (location: MapLocation) => void;
}

export const MobileJobListView = memo(function MobileJobListView({
  locations,
  isLoading,
  onLocationSelect,
}: MobileJobListViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
          <p className="text-sm">Loading locations...</p>
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <MapPin className="w-10 h-10 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">No locations found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
        </div>
      </div>
    );
  }

  // Sort by job count descending
  const sorted = [...locations].sort((a, b) => b.jobCount - a.jobCount);

  return (
    <div className="pt-16 pb-20 px-4 space-y-2" role="list" aria-label="Job locations">
      <p className="text-xs text-muted-foreground mb-3">
        {locations.length} locations • {locations.reduce((s, l) => s + l.jobCount, 0)} jobs
      </p>
      {sorted.map((location) => (
        <button
          key={location.id}
          onClick={() => onLocationSelect(location)}
          className={cn(
            "w-full text-left p-4 rounded-lg border border-border bg-card",
            "transition-all duration-150",
            "hover:border-primary/50 hover:shadow-md",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "active:scale-[0.99]"
          )}
          role="listitem"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span className="truncate">{location.displayName}</span>
                </h3>
                <LocationConfidenceBadge confidence={location.confidence} showLabel={false} />
              </div>

              <p className="text-sm text-muted-foreground mt-1">
                <Briefcase className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                {location.jobCount} {location.jobCount === 1 ? 'job' : 'jobs'}
              </p>

              {location.companies.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {location.companies.slice(0, 2).join(', ')}
                    {location.companies.length > 2 && ` +${location.companies.length - 2}`}
                  </span>
                </p>
              )}
            </div>
            <div className="text-2xl font-bold text-primary shrink-0">
              {location.jobCount}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
});

export default MobileJobListView;
