/**
 * Job Map Component
 * Interactive map visualization of job locations with heat map, clustering, and accessibility
 */

import { useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from './MarkerClusterGroup';
import L, { DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapLocation } from '@/hooks/useJobMapData';
import { JobMarker } from './JobMarker';
import { LazyHeatMapLayer } from './LazyHeatMapLayer';
import { MapZoomControls } from './MapControls';
import { MapBoundsController } from './MapBoundsController';
import { useTheme } from '@/components/ThemeProvider';
import { 
  US_CENTER, 
  DEFAULT_ZOOM, 
  MIN_ZOOM, 
  MAX_ZOOM, 
  FLY_TO_ZOOM,
  FLY_TO_DURATION,
  MAP_ATTRIBUTION,
  CLUSTER_SIZE,
  CLUSTER_THRESHOLDS,
  CLUSTER_RADIUS,
  getTileUrl,
  type DisplayMode,
} from './constants';
import { useMapContextOptional } from './MapContext';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface JobMapProps {
  locations: MapLocation[];
  selectedLocation: MapLocation | null;
  onLocationSelect: (location: MapLocation | null) => void;
  showHeatMap?: boolean;
  showMarkers?: boolean;
  autoFitBounds?: boolean;
  displayMode?: DisplayMode;
  className?: string;
  /** When false, map is a visual-only backdrop with no user interaction */
  interactive?: boolean;
  /** When true, renders a curated visual-only map for homepage hero — no labels, no popups, soft glow markers */
  heroMode?: boolean;
}

function MapController({ 
  selectedLocation,
  onMapClick 
}: { 
  selectedLocation: MapLocation | null;
  onMapClick?: () => void;
}) {
  const map = useMap();
  const previousLocation = useRef<MapLocation | null>(null);

  useEffect(() => {
    if (selectedLocation && selectedLocation !== previousLocation.current) {
      map.flyTo([selectedLocation.lat, selectedLocation.lng], FLY_TO_ZOOM, {
        duration: FLY_TO_DURATION,
      });
      previousLocation.current = selectedLocation;
    }
  }, [selectedLocation, map]);

  useMapEvents({
    click: () => {
      onMapClick?.();
    },
  });

  return null;
}

function KeyboardNavigationHandler({ 
  locations,
  selectedLocation,
  onLocationSelect 
}: {
  locations: MapLocation[];
  selectedLocation: MapLocation | null;
  onLocationSelect: (location: MapLocation | null) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!locations.length) return;
      const currentIndex = selectedLocation 
        ? locations.findIndex(l => l.id === selectedLocation.id)
        : -1;
      let newIndex = currentIndex;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          newIndex = currentIndex < locations.length - 1 ? currentIndex + 1 : 0;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : locations.length - 1;
          break;
        case 'Escape':
          onLocationSelect(null);
          return;
        default:
          return;
      }

      if (newIndex !== currentIndex && locations[newIndex]) {
        onLocationSelect(locations[newIndex]);
      }
    };

    const mapContainer = map.getContainer();
    mapContainer.addEventListener('keydown', handleKeyDown);
    return () => mapContainer.removeEventListener('keydown', handleKeyDown);
  }, [map, locations, selectedLocation, onLocationSelect]);

  return null;
}

function createClusterIcon(cluster: { getChildCount: () => number }, displayMode: DisplayMode, heroMode = false): DivIcon {
  const count = cluster.getChildCount();

  if (heroMode) {
    // Hero mode: soft glowing dots with no text labels
    const size = count >= CLUSTER_THRESHOLDS.LARGE ? 28 : count >= CLUSTER_THRESHOLDS.MEDIUM ? 22 : 16;
    return L.divIcon({
      html: `<div class="hero-cluster-dot"></div>`,
      className: `hero-cluster hero-cluster-${count >= CLUSTER_THRESHOLDS.LARGE ? 'large' : count >= CLUSTER_THRESHOLDS.MEDIUM ? 'medium' : 'small'}`,
      iconSize: L.point(size, size, true),
    });
  }

  const scale = displayMode === 'density' ? 1.1 : displayMode === 'detail' ? 0.95 : 1;
  let baseSize: number = CLUSTER_SIZE.SMALL;
  let className = 'job-cluster-small';
  
  if (count >= CLUSTER_THRESHOLDS.LARGE) {
    baseSize = CLUSTER_SIZE.LARGE;
    className = 'job-cluster-large';
  } else if (count >= CLUSTER_THRESHOLDS.MEDIUM) {
    baseSize = CLUSTER_SIZE.MEDIUM;
    className = 'job-cluster-medium';
  }

  const size = Math.round(baseSize * scale);

  return L.divIcon({
    html: `<div class="job-cluster-inner" role="img" aria-label="${count} jobs in this area">${count}</div>`,
    className: `job-cluster ${className}`,
    iconSize: L.point(size, size, true),
  });
}
/** Lightweight marker for hero mode — soft dot, no text, no interaction */
function HeroMarker({ location }: { location: MapLocation }) {
  const size = Math.min(12, 6 + location.jobCount * 0.3);
  const icon = useMemo(() => L.divIcon({
    html: `<div class="hero-marker-dot" style="width:${size}px;height:${size}px;"></div>`,
    className: '',
    iconSize: L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2),
  }), [size]);

  return <Marker position={[location.lat, location.lng]} icon={icon} interactive={false} />;
}

export const JobMap = memo(function JobMap({
  locations,
  selectedLocation,
  onLocationSelect,
  showHeatMap = false,
  showMarkers = true,
  autoFitBounds = true,
  displayMode = 'standard',
  className = '',
  interactive = true,
  heroMode = false,
}: JobMapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const mapContext = useMapContextOptional();
  const isMobile = mapContext?.isMobile ?? false;

  const tileUrl = getTileUrl(displayMode, isDark);
  const clusterRadius = CLUSTER_RADIUS[displayMode];

  const handleMapClick = useCallback(() => {}, []);

  const totalJobs = locations.reduce((sum, loc) => sum + loc.jobCount, 0);

  const iconCreateFn = useMemo(() => {
    return (cluster: { getChildCount: () => number }) => createClusterIcon(cluster, displayMode, heroMode);
  }, [displayMode, heroMode]);

  const clusterStyles = useMemo(() => {
    const glowEffect = displayMode === 'detail'
      ? `.job-cluster { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(255,255,255,0.15); }`
      : displayMode === 'density'
      ? `.job-cluster { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); opacity: 0.95; }`
      : `.job-cluster { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }`;
    return glowEffect;
  }, [displayMode]);

  // Hero mode tile: always use light no-labels for clean backdrop
  const finalTileUrl = heroMode ? 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png' : tileUrl;
  const finalClusterRadius = heroMode ? 80 : clusterRadius;

  return (
    <div 
      className={`relative w-full h-full ${className}`}
      role={heroMode ? 'img' : 'application'}
      aria-label={heroMode ? 'Map showing job locations across the United States' : `Interactive job map showing ${totalJobs} jobs across ${locations.length} locations`}
    >
      <style>{`
        .job-cluster {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-weight: 600;
          color: white;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        ${clusterStyles}
        .job-cluster:hover,
        .job-cluster:focus {
          transform: scale(1.1);
          outline: 3px solid hsl(var(--ring));
          outline-offset: 2px;
        }
        .job-cluster-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          font-size: 13px;
          letter-spacing: -0.01em;
        }
        .job-cluster-small {
          background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%);
        }
        .job-cluster-medium {
          background: linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(217 91% 50%) 100%);
        }
        .job-cluster-large {
          background: linear-gradient(135deg, hsl(262 83% 58%) 0%, hsl(262 83% 48%) 100%);
        }

        /* Hero mode styles — soft glowing dots, no text */
        .hero-cluster {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          pointer-events: none;
        }
        .hero-cluster-dot {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          animation: hero-pulse 3s ease-in-out infinite;
        }
        .hero-cluster-small .hero-cluster-dot {
          background: radial-gradient(circle, hsl(var(--primary) / 0.6) 0%, hsl(var(--primary) / 0.15) 70%, transparent 100%);
          box-shadow: 0 0 12px hsl(var(--primary) / 0.3);
        }
        .hero-cluster-medium .hero-cluster-dot {
          background: radial-gradient(circle, hsl(217 91% 60% / 0.6) 0%, hsl(217 91% 60% / 0.15) 70%, transparent 100%);
          box-shadow: 0 0 20px hsl(217 91% 60% / 0.3);
        }
        .hero-cluster-large .hero-cluster-dot {
          background: radial-gradient(circle, hsl(262 83% 58% / 0.55) 0%, hsl(262 83% 58% / 0.12) 70%, transparent 100%);
          box-shadow: 0 0 28px hsl(262 83% 58% / 0.3);
        }
        @keyframes hero-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }

        /* Hero mode marker overrides */
        .hero-marker-dot {
          border-radius: 50%;
          pointer-events: none;
          background: radial-gradient(circle, hsl(var(--primary) / 0.5) 0%, hsl(var(--primary) / 0.1) 70%, transparent 100%);
          box-shadow: 0 0 8px hsl(var(--primary) / 0.25);
        }

        .leaflet-container {
          font-family: inherit;
          border-radius: var(--radius);
        }
        .leaflet-container:focus {
          outline: 3px solid hsl(var(--ring));
          outline-offset: 2px;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          background: hsl(var(--popover));
          color: hsl(var(--popover-foreground));
        }
        .leaflet-popup-content {
          margin: 0;
        }
        .leaflet-popup-tip {
          background: hsl(var(--popover));
        }
        .leaflet-control-zoom {
          display: none !important;
        }
        .leaflet-control-attribution {
          font-size: 8px !important;
          background: transparent !important;
          color: hsl(var(--muted-foreground) / 0.4) !important;
          opacity: 0.5;
          pointer-events: none;
        }
        .leaflet-control-attribution a {
          color: inherit !important;
          text-decoration: none !important;
        }
        @media (pointer: coarse) {
          .job-cluster,
          .job-marker-icon > div {
            min-width: 44px;
            min-height: 44px;
          }
        }
        @media (prefers-contrast: high) {
          .job-cluster {
            border: 2px solid white;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .job-cluster,
          .job-marker-icon > div {
            transition: none !important;
            animation: none !important;
          }
          .leaflet-fade-anim .leaflet-tile,
          .leaflet-zoom-anim .leaflet-zoom-animated {
            transition: none !important;
          }
        }
      `}</style>

      <MapContainer
        center={US_CENTER}
        zoom={heroMode ? 4 : DEFAULT_ZOOM}
        scrollWheelZoom={interactive && !heroMode ? !isMobile : false}
        className={`w-full h-full ${heroMode ? '' : 'rounded-lg'}`}
        minZoom={heroMode ? 3 : MIN_ZOOM}
        maxZoom={heroMode ? 6 : MAX_ZOOM}
        keyboard={interactive && !heroMode}
        keyboardPanDelta={80}
        touchZoom={interactive && !heroMode}
        dragging={interactive && !heroMode}
        doubleClickZoom={interactive && !heroMode}
        zoomControl={false}
        bounceAtZoomLimits={false}
        attributionControl={!heroMode && interactive}
      >
        <TileLayer
          attribution={MAP_ATTRIBUTION}
          url={finalTileUrl}
        />

        {interactive && !heroMode && (
          <MapController 
            selectedLocation={selectedLocation} 
            onMapClick={handleMapClick}
          />
        )}

        {interactive && !heroMode && (
          <KeyboardNavigationHandler
            locations={locations}
            selectedLocation={selectedLocation}
            onLocationSelect={onLocationSelect}
          />
        )}

        {!heroMode && (
          <MapBoundsController
            locations={locations}
            enabled={autoFitBounds}
          />
        )}

        {!heroMode && (
          <LazyHeatMapLayer 
            locations={locations} 
            visible={showHeatMap}
            intensity={displayMode === 'density' ? 1 : 0.8}
          />
        )}

        {interactive && !heroMode && <MapZoomControls />}

        {showMarkers && (
          <MarkerClusterGroup
            chunkedLoading
            spiderfyOnMaxZoom={!heroMode && interactive}
            showCoverageOnHover={false}
            maxClusterRadius={finalClusterRadius}
            iconCreateFunction={iconCreateFn}
            animate={!heroMode}
            spiderfyDistanceMultiplier={1.5}
            zoomToBoundsOnClick={!heroMode && interactive}
            disableClusteringAtZoom={heroMode ? 99 : undefined}
          >
            {heroMode
              ? locations.map((location) => (
                  <HeroMarker key={location.id} location={location} />
                ))
              : locations.map((location) => (
                  <JobMarker
                    key={location.id}
                    location={location}
                    isSelected={interactive ? selectedLocation?.id === location.id : false}
                    onClick={interactive ? () => onLocationSelect(location) : () => {}}
                    displayMode={displayMode}
                  />
                ))
            }
          </MarkerClusterGroup>
        )}
      </MapContainer>

      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {selectedLocation && (
          `Selected ${selectedLocation.displayName} with ${selectedLocation.jobCount} jobs`
        )}
      </div>
    </div>
  );
});

export default JobMap;
