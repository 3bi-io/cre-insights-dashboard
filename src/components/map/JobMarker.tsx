/**
 * Enhanced Job Marker Component
 * Accessible map markers with confidence badges, display-mode-aware sizing, and mobile touch targets
 */

import { memo, useMemo, useRef, useEffect } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapLocation } from '@/hooks/useJobMapData';
import { MapPin, Building2, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/design-system/Button';
import { LocationConfidenceBadge } from './LocationConfidenceBadge';
import { formatDistanceToNow } from 'date-fns';
import { IS_TOUCH_DEVICE, MARKER_SIZE, MARKER_THRESHOLDS, MARKER_SCALE, type DisplayMode } from './constants';
import { useMapContextOptional } from './MapContext';

interface JobMarkerProps {
  location: MapLocation;
  isSelected: boolean;
  onClick: () => void;
  directToPanel?: boolean;
  displayMode?: DisplayMode;
}

function getMarkerColor(jobCount: number): string {
  if (jobCount >= MARKER_THRESHOLDS.HOT) return 'hsl(262, 83%, 58%)';
  if (jobCount >= MARKER_THRESHOLDS.HIGH) return 'hsl(217, 91%, 60%)';
  if (jobCount >= MARKER_THRESHOLDS.MEDIUM) return 'hsl(142, 76%, 36%)';
  return 'hsl(var(--primary))';
}

function getMarkerSize(jobCount: number, isTouchDevice: boolean): number {
  if (jobCount >= MARKER_THRESHOLDS.HOT) {
    return isTouchDevice ? MARKER_SIZE.LARGE_TOUCH : MARKER_SIZE.LARGE;
  }
  if (jobCount >= MARKER_THRESHOLDS.HIGH) {
    return isTouchDevice ? MARKER_SIZE.MEDIUM_TOUCH : MARKER_SIZE.MEDIUM;
  }
  if (jobCount >= MARKER_THRESHOLDS.MEDIUM) {
    return isTouchDevice ? MARKER_SIZE.SMALL_TOUCH : MARKER_SIZE.SMALL;
  }
  return isTouchDevice ? MARKER_SIZE.BASE_TOUCH : MARKER_SIZE.BASE;
}

function getConfidenceBorder(confidence: string): string {
  if (confidence === 'exact') return '0 0 0 3px white';
  if (confidence === 'state') return '0 0 0 3px white, 0 0 0 5px rgba(245, 158, 11, 0.5)';
  return '0 0 0 3px white, 0 0 0 5px rgba(59, 130, 246, 0.5)';
}

export const JobMarker = memo(function JobMarker({
  location,
  isSelected,
  onClick,
  directToPanel: directToPanelProp,
  displayMode = 'standard',
}: JobMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker>(null);
  const mapContext = useMapContextOptional();
  
  const isMobile = mapContext?.isMobile ?? false;
  const directToPanel = directToPanelProp ?? isMobile;
  const isTouchDevice = mapContext?.isTouchDevice ?? IS_TOUCH_DEVICE;

  const modeScale = MARKER_SCALE[displayMode];

  const icon = useMemo(() => {
    const baseSize = getMarkerSize(location.jobCount, isTouchDevice);
    const size = Math.round(baseSize * modeScale);
    const color = location.isInternational 
      ? 'hsl(200, 80%, 50%)'
      : getMarkerColor(location.jobCount);
    const selectedScale = isSelected ? 1.15 : 1;
    const finalSize = Math.round(size * selectedScale);
    const shadowAlpha = displayMode === 'density' ? 0.15 : 0.3;
    const boxShadow = `0 4px 12px rgba(0, 0, 0, ${shadowAlpha}), ${getConfidenceBorder(location.confidence)}`;
    const intlBorder = location.isInternational ? 'border: 2px dashed rgba(255,255,255,0.7);' : '';

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
          font-size: ${Math.max(11, finalSize * 0.35)}px;
          box-shadow: ${boxShadow};
          transition: transform 0.2s ease;
          cursor: pointer;
          ${intlBorder}
          ${isSelected ? 'outline: 3px solid hsl(var(--ring)); outline-offset: 2px;' : ''}
        "
        role="button"
        tabindex="0"
        aria-label="${location.jobCount} jobs in ${location.displayName} (${location.confidence} location${location.isInternational ? ', international' : ''})"
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
  }, [location.jobCount, location.displayName, location.confidence, location.isInternational, isSelected, isTouchDevice, modeScale, displayMode]);

  useEffect(() => {
    if (directToPanel && markerRef.current) {
      markerRef.current.closePopup();
    }
  }, [directToPanel, isSelected]);

  const handleClick = () => {
    if (directToPanel) {
      markerRef.current?.closePopup();
      onClick();
    }
  };

  const previewJobs = location.jobs.slice(0, displayMode === 'detail' ? 4 : displayMode === 'density' ? 1 : 3);
  const showCompactPopup = displayMode === 'density';

  return (
    <Marker
      ref={markerRef}
      position={[location.lat, location.lng]}
      icon={icon}
      eventHandlers={{
        click: handleClick,
        keypress: (e) => {
          if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') {
            handleClick();
          }
        },
      }}
    >
      {!directToPanel && (
        <Popup
          className="job-location-popup"
          closeButton={true}
          autoPan={true}
          maxWidth={showCompactPopup ? 260 : 320}
          minWidth={showCompactPopup ? 200 : 280}
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
              <LocationConfidenceBadge confidence={location.confidence} />
            </div>

            {/* Companies — hide in density mode */}
            {!showCompactPopup && location.companies.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="truncate">
                  {location.companies.slice(0, 2).join(', ')}
                  {location.companies.length > 2 && ` +${location.companies.length - 2} more`}
                </span>
              </div>
            )}

            {/* Categories — show in standard/detail */}
            {!showCompactPopup && location.topCategories.length > 0 && (
              <div className="flex flex-wrap gap-1" role="list" aria-label="Job categories">
                {location.topCategories.slice(0, displayMode === 'detail' ? 4 : 2).map((category) => (
                  <Badge key={category} variant="outline" className="text-xs" role="listitem">
                    {category}
                  </Badge>
                ))}
              </div>
            )}

            {/* Preview Jobs */}
            {previewJobs.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border" role="list" aria-label="Sample job listings">
                {previewJobs.map((job) => (
                  <div key={job.id} className="flex items-start gap-2 text-sm" role="listitem">
                    <Briefcase className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{job.title || job.job_title}</p>
                      {!showCompactPopup && (
                        <p className="text-xs text-muted-foreground">
                          {job.clients?.name || job.organizations?.name || 'Company'}
                          {job.created_at && (
                            <span className="ml-1">
                              • {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

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
      )}
    </Marker>
  );
});

export default JobMarker;
