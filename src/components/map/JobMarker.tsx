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

function getMarkerSize(jobCount: number): number {
  if (jobCount >= 50) return 36;
  if (jobCount >= 20) return 32;
  if (jobCount >= 5) return 28;
  return 24;
}

export const JobMarker = memo(function JobMarker({
  location,
  isSelected,
  onClick,
}: JobMarkerProps) {
  // Create custom icon
  const icon = useMemo(() => {
    const size = getMarkerSize(location.jobCount);
    const color = getMarkerColor(location.jobCount);
    const selectedScale = isSelected ? 1.2 : 1;
    const finalSize = size * selectedScale;

    const html = `
      <div style="
        width: ${finalSize}px;
        height: ${finalSize}px;
        background: ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: ${finalSize * 0.4}px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 3px white;
        transition: transform 0.2s ease;
        cursor: pointer;
        ${isSelected ? 'animation: pulse 1.5s infinite;' : ''}
      ">
        ${location.jobCount}
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      </style>
    `;

    return L.divIcon({
      html,
      className: 'job-marker-icon',
      iconSize: L.point(finalSize, finalSize),
      iconAnchor: L.point(finalSize / 2, finalSize / 2),
    });
  }, [location.jobCount, isSelected]);

  // Preview jobs for popup
  const previewJobs = location.jobs.slice(0, 3);

  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={icon}
      eventHandlers={{
        click: onClick,
      }}
    >
      <Popup
        className="job-location-popup"
        closeButton={true}
        autoPan={true}
        maxWidth={320}
        minWidth={280}
      >
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-base flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
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
              <Building2 className="w-3.5 h-3.5" />
              <span className="truncate">
                {location.companies.slice(0, 2).join(', ')}
                {location.companies.length > 2 && ` +${location.companies.length - 2} more`}
              </span>
            </div>
          )}

          {/* Categories */}
          {location.topCategories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {location.topCategories.map((category) => (
                <Badge key={category} variant="outline" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          )}

          {/* Preview Jobs */}
          <div className="space-y-2 pt-2 border-t border-border">
            {previewJobs.map((job) => (
              <div key={job.id} className="flex items-start gap-2 text-sm">
                <Briefcase className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
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
          >
            View All {location.jobCount} Jobs
          </Button>
        </div>
      </Popup>
    </Marker>
  );
});
