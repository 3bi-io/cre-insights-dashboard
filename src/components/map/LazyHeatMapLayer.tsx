/**
 * Lazy-loaded Heat Map Layer Component
 * Only loads leaflet.heat when the heat map is first enabled
 * Improves initial load performance on lower-powered devices
 */

import { useState, useEffect, memo, lazy, Suspense } from 'react';
import { MapLocation } from '@/hooks/useJobMapData';
import { Loader2 } from 'lucide-react';

interface LazyHeatMapLayerProps {
  locations: MapLocation[];
  visible: boolean;
  intensity?: number;
}

// Lazy load the actual heat map component
const HeatMapLayer = lazy(() => import('./HeatMapLayer'));

// Loading indicator shown while heat map library loads
function HeatMapLoadingIndicator() {
  return (
    <div 
      className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[1000] 
                 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 
                 shadow-lg border border-border flex items-center gap-2"
      role="status"
      aria-label="Loading heat map visualization"
    >
      <Loader2 className="w-4 h-4 animate-spin text-primary" aria-hidden="true" />
      <span className="text-sm font-medium">Loading heat map...</span>
    </div>
  );
}

export const LazyHeatMapLayer = memo(function LazyHeatMapLayer({
  locations,
  visible,
  intensity = 1,
}: LazyHeatMapLayerProps) {
  // Track if heat map has ever been enabled (for lazy loading)
  const [hasBeenEnabled, setHasBeenEnabled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Once visible is true, mark as enabled so we keep the component mounted
  useEffect(() => {
    if (visible && !hasBeenEnabled) {
      setHasBeenEnabled(true);
    }
  }, [visible, hasBeenEnabled]);

  // Don't render anything until heat map has been requested at least once
  if (!hasBeenEnabled) {
    return null;
  }

  return (
    <Suspense fallback={<HeatMapLoadingIndicator />}>
      <HeatMapLayerWithLoadCallback
        locations={locations}
        visible={visible}
        intensity={intensity}
        onLoad={() => setIsLoaded(true)}
      />
      {/* Show loading indicator until component reports it's loaded */}
      {!isLoaded && visible && <HeatMapLoadingIndicator />}
    </Suspense>
  );
});

// Wrapper that reports when the heat layer is ready
const HeatMapLayerWithLoadCallback = memo(function HeatMapLayerWithLoadCallback({
  locations,
  visible,
  intensity,
  onLoad,
}: LazyHeatMapLayerProps & { onLoad: () => void }) {
  useEffect(() => {
    // Report loaded after first render
    onLoad();
  }, [onLoad]);

  return <HeatMapLayer locations={locations} visible={visible} intensity={intensity} />;
});

export default LazyHeatMapLayer;
