/**
 * Heat Map Layer Component
 * Renders a heat map visualization of job density on the map
 */

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { MapLocation } from '@/hooks/useJobMapData';

// Extend Leaflet types for heat layer
declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: HeatMapOptions
  ): HeatLayer;

  interface HeatMapOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: { [key: number]: string };
  }

  interface HeatLayer extends L.Layer {
    setLatLngs(latlngs: Array<[number, number, number?]>): this;
    addLatLng(latlng: [number, number, number?]): this;
    setOptions(options: HeatMapOptions): this;
    redraw(): this;
  }
}

interface HeatMapLayerProps {
  locations: MapLocation[];
  visible: boolean;
  intensity?: number; // 0-1 multiplier for heat intensity
}

export function HeatMapLayer({ 
  locations, 
  visible,
  intensity = 1 
}: HeatMapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!visible || locations.length === 0) {
      return;
    }

    // Calculate heat points from locations
    // Each location contributes heat based on job count
    const heatPoints: [number, number, number][] = locations.map((location) => {
      // Normalize job count for heat intensity (0-1 scale, capped at 50 jobs)
      const normalizedIntensity = Math.min(location.jobCount / 50, 1) * intensity;
      return [location.lat, location.lng, normalizedIntensity];
    });

    // Create heat layer with accessible gradient colors
    // Using a gradient that's distinguishable for color blindness
    const heatLayer = L.heatLayer(heatPoints, {
      radius: 35,
      blur: 25,
      maxZoom: 10,
      minOpacity: 0.4,
      max: 1.0,
      gradient: {
        0.0: 'rgba(0, 0, 255, 0)',      // Transparent blue
        0.2: 'rgba(0, 128, 255, 0.6)',  // Light blue
        0.4: 'rgba(0, 255, 128, 0.7)',  // Cyan-green
        0.6: 'rgba(255, 255, 0, 0.8)',  // Yellow
        0.8: 'rgba(255, 128, 0, 0.9)',  // Orange
        1.0: 'rgba(255, 0, 0, 1)',       // Red
      },
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, locations, visible, intensity]);

  return null;
}

export default HeatMapLayer;
