/**
 * Enhanced Job Marker Component
 * Accessible map markers with improved mobile touch targets
 */

import { memo, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapLocation } from '@/hooks/useJobMapData';
import { MapPin, Building2, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/design-system/Button';
import { formatDistanceToNow } from 'date-fns';

interface JobMarkerProps {
  location: MapLocation;
  isSelected: boolean;
  onClick: () => void;
}

function getMarkerColor(jobCount: number): string {
  if (jobCount >= 50) return 'hsl(262, 83%, 58%)'; // Purple for hot spots
  if (jobCount >= 20) return 'hsl(217, 91%, 60%)'; // Blue for high
  if (jobCount >= 5) return 'hsl(142, 76%, 36%)';  // Green for medium
  return 'hsl(var(--primary))'; // Primary for low
}

function getMarkerSize(jobCount: number, isTouchDevice: boolean): number {
  // Larger minimum size for touch devices (44px minimum for WCAG compliance)
  const baseSize = isTouchDevice ? 44 : 24;
  
  if (jobCount >= 50) return isTouchDevice ? 56 : 36;
  if (jobCount >= 20) return isTouchDevice ? 50 : 32;
  if (jobCount >= 5) return isTouchDevice ? 46 : 28;
  return baseSize;
}

// Check if device has touch capability
const isTouchDevice = typeof window !== 'undefined' && 
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

export const JobMarker = memo(function JobMarker({
  location,
  isSelected,
  onClick,
}: JobMarkerProps) {
  // Create custom accessible icon
  const icon = useMemo(() => {
    const size = getMarkerSize(location.jobCount, isTouchDevice);
    const color = getMarkerColor(location.jobCount);
    const selectedScale = isSelected ? 1.15 : 1;
    const finalSize = Math.round(size * selectedScale);

    const html = `
      <div 
        style="
          width: ${finalSize}px;
          height: ${finalSize}px;
          background: ${color};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: ${Math.max(12, finalSize * 0.35)}px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 3px white;
          transition: transform 0.2s ease;
          cursor: pointer;
          ${isSelected ? 'outline: 3px solid hsl(var(--ring)); outline-offset: 2px;' : ''}
        "
        role="button"
        tabindex="0"
        aria-label="${location.jobCount} jobs in ${location.displayName}"
        aria-pressed="${isSelected}"
      >
        ${location.jobCount}
      </div>
    `;

    return L.divIcon({
      html,
      className: 'job-marker-icon',
      iconSize: L.point(finalSize, finalSize),
      iconAnchor: L.point(finalSize / 2, finalSize / 2),
    });
  }, [location.jobCount, location.displayName, isSelected]);

  // Preview jobs for popup
  const previewJobs = location.jobs.slice(0, 3);

  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={icon}
      eventHandlers={{
        click: onClick,
        keypress: (e) => {
          if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') {
            onClick();
          }
        },
      }}
    >
      <Popup
        className="job-location-popup"
        closeButton={true}
        autoPan={true}
        maxWidth={320}
        minWidth={280}
      >
        <div 
          className="p-4 space-y-3"
          role="dialog"
          aria-labelledby={`popup-title-${location.id}`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 
                id={`popup-title-${location.id}`}
                className="font-semibold text-base flex items-center gap-1.5"
              >
                <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
                {location.displayName}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {location.jobCount} {location.jobCount === 1 ? 'job' : 'jobs'} available
              </p>
            </div>
            {!location.isExact && (
              <Badge variant="secondary" className="text-xs">
                Regional
              </Badge>
            )}
          </div>

          {/* Companies */}
          {location.companies.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="truncate">
                {location.companies.slice(0, 2).join(', ')}
                {location.companies.length > 2 && ` +${location.companies.length - 2} more`}
              </span>
            </div>
          )}

          {/* Categories */}
          {location.topCategories.length > 0 && (
            <div 
              className="flex flex-wrap gap-1"
              role="list"
              aria-label="Job categories"
            >
              {location.topCategories.map((category) => (
                <Badge 
                  key={category} 
                  variant="outline" 
                  className="text-xs"
                  role="listitem"
                >
                  {category}
                </Badge>
              ))}
            </div>
          )}

          {/* Preview Jobs */}
          <div 
            className="space-y-2 pt-2 border-t border-border"
            role="list"
            aria-label="Sample job listings"
          >
            {previewJobs.map((job) => (
              <div 
                key={job.id} 
                className="flex items-start gap-2 text-sm"
                role="listitem"
              >
                <Briefcase className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{job.title || job.job_title}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.clients?.name || job.organizations?.name || 'Company'}
                    {job.created_at && (
                      <span className="ml-1">
                        • {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          <Button
            variant="default"
            size="sm"
            className="w-full"
            onClick={onClick}
            aria-label={`View all ${location.jobCount} jobs in ${location.displayName}`}
          >
            View All {location.jobCount} Jobs
          </Button>
        </div>
      </Popup>
    </Marker>
  );
});

export default JobMarker;
