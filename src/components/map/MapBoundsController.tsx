/**
 * Map Bounds Controller
 * Auto-fits map bounds to show all visible locations when data changes.
 */

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapLocation } from '@/hooks/useJobMapData';
import { US_CENTER, DEFAULT_ZOOM, FLY_TO_DURATION } from './constants';

interface MapBoundsControllerProps {
  locations: MapLocation[];
  /** If true, auto-fit is active */
  enabled: boolean;
}

export function MapBoundsController({ locations, enabled }: MapBoundsControllerProps) {
  const map = useMap();
  const prevLocationCount = useRef(locations.length);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!enabled) return;

    // Skip on initial mount (let the default US view show first load)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevLocationCount.current = locations.length;
      return;
    }

    // Only auto-fit when location count changes (i.e. filter changed)
    if (locations.length === prevLocationCount.current) return;
    prevLocationCount.current = locations.length;

    if (locations.length === 0) {
      map.flyTo(US_CENTER, DEFAULT_ZOOM, { duration: FLY_TO_DURATION });
      return;
    }

    if (locations.length === 1) {
      map.flyTo([locations[0].lat, locations[0].lng], 10, { duration: FLY_TO_DURATION });
      return;
    }

    const bounds = L.latLngBounds(locations.map(l => [l.lat, l.lng] as [number, number]));
    map.flyToBounds(bounds, {
      padding: [50, 50],
      maxZoom: 12,
      duration: FLY_TO_DURATION,
    });
  }, [locations, enabled, map]);

  return null;
}

export default MapBoundsController;
