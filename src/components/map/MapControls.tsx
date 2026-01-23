/**
 * Enhanced Map Controls Component
 * Responsive zoom and layer controls with larger touch targets
 */

import { memo } from 'react';
import { useMap } from 'react-leaflet';
import { Plus, Minus, Home, Flame, MapPin } from 'lucide-react';
import { Button } from '@/components/design-system/Button';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useMapContextOptional } from './MapContext';
import { US_CENTER, DEFAULT_ZOOM, FLY_TO_DURATION } from './constants';
import { useIsMobile } from '@/hooks/use-mobile';

interface MapControlsProps {
  showHeatMap: boolean;
  onToggleHeatMap: () => void;
  showMarkers: boolean;
  onToggleMarkers: () => void;
  className?: string;
}

// Zoom Controls Component (uses Leaflet context)
function ZoomControls() {
  const map = useMap();
  const mapContext = useMapContextOptional();
  const isMobile = mapContext?.isMobile ?? false;

  const handleZoomIn = () => map.zoomIn();
  const handleZoomOut = () => map.zoomOut();
  const handleReset = () => map.flyTo(US_CENTER, DEFAULT_ZOOM, { duration: FLY_TO_DURATION });

  // Button size based on device
  const buttonSize = isMobile ? 'h-11 w-11' : 'h-9 w-9';
  const iconSize = isMobile ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <TooltipProvider delayDuration={300}>
      <div 
        className="flex flex-col gap-1 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border p-1"
        role="group"
        aria-label="Map zoom controls"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className={cn(buttonSize, "hover:bg-accent")}
              aria-label="Zoom in"
            >
              <Plus className={iconSize} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={8}>
            <p>Zoom in</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className={cn(buttonSize, "hover:bg-accent")}
              aria-label="Zoom out"
            >
              <Minus className={iconSize} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={8}>
            <p>Zoom out</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-full h-px bg-border" aria-hidden="true" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className={cn(buttonSize, "hover:bg-accent")}
              aria-label="Reset view to show all of United States"
            >
              <Home className={iconSize} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={8}>
            <p>Reset view</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

// Export zoom controls for use inside MapContainer
export function MapZoomControls() {
  return (
    <div className="absolute top-20 right-4 z-[1000]">
      <ZoomControls />
    </div>
  );
}

// Layer Controls Component (used outside MapContainer)
export const MapLayerControls = memo(function MapLayerControls({
  showHeatMap,
  onToggleHeatMap,
  showMarkers,
  onToggleMarkers,
  className,
}: MapControlsProps) {
  const mapContext = useMapContextOptional();
  const isMobileFallback = useIsMobile();
  const isMobile = mapContext?.isMobile ?? isMobileFallback;

  // Larger touch targets on mobile
  const toggleSize = isMobile ? 'h-11 w-11' : 'h-9 w-9';
  const iconSize = isMobile ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <TooltipProvider delayDuration={300}>
      <div 
        className={cn(
          "absolute z-[1000] flex flex-col gap-1 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border p-1",
          // Position: bottom-right on all devices
          "bottom-4 right-4",
          className
        )}
        role="group"
        aria-label="Map layer controls"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              pressed={showHeatMap}
              onPressedChange={onToggleHeatMap}
              className={cn(toggleSize, "data-[state=on]:bg-destructive/20 data-[state=on]:text-destructive")}
              aria-label={showHeatMap ? 'Hide heat map' : 'Show heat map'}
            >
              <Flame className={iconSize} />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={8}>
            <p>{showHeatMap ? 'Hide' : 'Show'} heat map</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              pressed={showMarkers}
              onPressedChange={onToggleMarkers}
              className={cn(toggleSize, "data-[state=on]:bg-primary/20 data-[state=on]:text-primary")}
              aria-label={showMarkers ? 'Hide markers' : 'Show markers'}
            >
              <MapPin className={iconSize} />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={8}>
            <p>{showMarkers ? 'Hide' : 'Show'} markers</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
});

export default MapLayerControls;
