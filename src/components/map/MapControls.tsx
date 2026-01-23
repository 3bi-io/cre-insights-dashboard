/**
 * Map Controls Component
 * Provides UI controls for map view options including heat map toggle
 */

import { memo } from 'react';
import { Flame, MapPin, Plus, Minus, LocateFixed } from 'lucide-react';
import { Button } from '@/components/design-system/Button';
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useMap } from 'react-leaflet';
import { cn } from '@/lib/utils';

interface MapControlsProps {
  showHeatMap: boolean;
  onToggleHeatMap: () => void;
  showMarkers: boolean;
  onToggleMarkers: () => void;
  className?: string;
}

// Internal component for zoom controls
function ZoomControls() {
  const map = useMap();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const handleResetView = () => {
    map.flyTo([39.8283, -98.5795], 4, { duration: 0.8 });
  };

  return (
    <div className="flex flex-col gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            className="bg-background/95 backdrop-blur-sm shadow-md h-9 w-9"
            aria-label="Zoom in"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Zoom in</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            className="bg-background/95 backdrop-blur-sm shadow-md h-9 w-9"
            aria-label="Zoom out"
          >
            <Minus className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Zoom out</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={handleResetView}
            className="bg-background/95 backdrop-blur-sm shadow-md h-9 w-9"
            aria-label="Reset map view to United States"
          >
            <LocateFixed className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Reset view</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

// Wrapper component for controls inside map container
export function MapZoomControls() {
  return (
    <div className="absolute top-20 right-4 z-[1000]">
      <ZoomControls />
    </div>
  );
}

// Layer toggle controls (outside map container)
export const MapLayerControls = memo(function MapLayerControls({
  showHeatMap,
  onToggleHeatMap,
  showMarkers,
  onToggleMarkers,
  className,
}: MapControlsProps) {
  return (
    <div 
      className={cn(
        "absolute bottom-4 right-4 z-[1000] flex flex-col gap-2",
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
            className={cn(
              "bg-background/95 backdrop-blur-sm shadow-lg h-10 w-10 p-0",
              "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            )}
            aria-label={showHeatMap ? "Hide heat map" : "Show heat map"}
          >
            <Flame className="w-4 h-4" />
          </Toggle>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{showHeatMap ? 'Hide' : 'Show'} heat map</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            pressed={showMarkers}
            onPressedChange={onToggleMarkers}
            className={cn(
              "bg-background/95 backdrop-blur-sm shadow-lg h-10 w-10 p-0",
              "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            )}
            aria-label={showMarkers ? "Hide job markers" : "Show job markers"}
          >
            <MapPin className="w-4 h-4" />
          </Toggle>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{showMarkers ? 'Hide' : 'Show'} markers</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
});

export default MapLayerControls;
