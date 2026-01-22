import { useEffect, useRef, memo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L, { DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapLocation } from '@/hooks/useJobMapData';
import { JobMarker } from './JobMarker';
import { useTheme } from 'next-themes';

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
  className?: string;
}

// US bounds for initial view
const US_CENTER: [number, number] = [39.8283, -98.5795];
const US_ZOOM = 4;

// Map controller component for external control
function MapController({ selectedLocation }: { selectedLocation: MapLocation | null }) {
  const map = useMap();
  const previousLocation = useRef<MapLocation | null>(null);

  useEffect(() => {
    if (selectedLocation && selectedLocation !== previousLocation.current) {
      map.flyTo([selectedLocation.lat, selectedLocation.lng], 10, {
        duration: 0.8,
      });
      previousLocation.current = selectedLocation;
    }
  }, [selectedLocation, map]);

  return null;
}

// Create custom cluster icon
function createClusterIcon(cluster: { getChildCount: () => number }): DivIcon {
  const count = cluster.getChildCount();
  
  // Determine size based on count
  let size = 40;
  let className = 'job-cluster-small';
  
  if (count >= 100) {
    size = 60;
    className = 'job-cluster-large';
  } else if (count >= 20) {
    size = 50;
    className = 'job-cluster-medium';
  }

  return L.divIcon({
    html: `<div class="job-cluster-inner">${count}</div>`,
    className: `job-cluster ${className}`,
    iconSize: L.point(size, size, true),
  });
}

export const JobMap = memo(function JobMap({
  locations,
  selectedLocation,
  onLocationSelect,
  className = '',
}: JobMapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Tile layer URL based on theme
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Custom cluster styles */}
      <style>{`
        .job-cluster {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-weight: 600;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s ease;
        }
        .job-cluster:hover {
          transform: scale(1.1);
        }
        .job-cluster-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          font-size: 14px;
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
        .leaflet-container {
          font-family: inherit;
          border-radius: var(--radius);
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        .leaflet-popup-content {
          margin: 0;
        }
        .leaflet-popup-tip {
          background: hsl(var(--popover));
        }
        .leaflet-popup-content-wrapper {
          background: hsl(var(--popover));
          color: hsl(var(--popover-foreground));
        }
      `}</style>

      <MapContainer
        center={US_CENTER}
        zoom={US_ZOOM}
        scrollWheelZoom={true}
        className="w-full h-full rounded-lg"
        minZoom={3}
        maxZoom={18}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileUrl}
        />

        <MapController selectedLocation={selectedLocation} />

        <MarkerClusterGroup
          chunkedLoading
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          maxClusterRadius={60}
          iconCreateFunction={createClusterIcon}
          animate={true}
        >
          {locations.map((location) => (
            <JobMarker
              key={location.id}
              location={location}
              isSelected={selectedLocation?.id === location.id}
              onClick={() => onLocationSelect(location)}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
});
