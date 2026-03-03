/**
 * DFW Geo-Fence Utility
 * Restricts platform access to a 200-mile radius around Dallas-Fort Worth.
 */

import type { GeoLocation } from './geo-lookup.ts';

// DFW metroplex center (midpoint between Dallas and Fort Worth)
const DFW_LAT = 32.8968;
const DFW_LON = -97.0380;
const ALLOWED_RADIUS_MILES = 200;
const EARTH_RADIUS_MILES = 3958.8;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine distance in miles between two lat/lon points.
 */
export function haversineDistanceMiles(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface ServiceAreaResult {
  allowed: boolean;
  distanceMiles: number | null;
}

/**
 * Check whether a GeoLocation falls within the DFW service area.
 * Returns allowed=true when coordinates are missing (fail-open).
 */
export function isWithinServiceArea(geo: GeoLocation | null): ServiceAreaResult {
  if (!geo || geo.lat === null || geo.lon === null) {
    return { allowed: true, distanceMiles: null };
  }

  const distance = haversineDistanceMiles(geo.lat, geo.lon, DFW_LAT, DFW_LON);
  return {
    allowed: distance <= ALLOWED_RADIUS_MILES,
    distanceMiles: Math.round(distance),
  };
}

export { ALLOWED_RADIUS_MILES };
