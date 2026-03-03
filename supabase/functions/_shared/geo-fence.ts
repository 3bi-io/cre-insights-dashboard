/**
 * DFW Geo-Fence Utility
 * Restricts platform access WITHIN a 200-mile radius around Dallas-Fort Worth.
 * Users inside this zone are blocked; users outside are allowed.
 */

import type { GeoLocation } from './geo-lookup.ts';

// DFW metroplex center (midpoint between Dallas and Fort Worth)
const DFW_LAT = 32.8968;
const DFW_LON = -97.0380;
const RESTRICTED_RADIUS_MILES = 200;
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

export interface RestrictedZoneResult {
  blocked: boolean;
  distanceMiles: number | null;
}

/**
 * Check whether a GeoLocation falls INSIDE the DFW restricted zone.
 * Returns blocked=true when user is within 200 miles of DFW.
 * Returns blocked=false when coordinates are missing (fail-open).
 */
export function checkRestrictedZone(geo: GeoLocation | null): RestrictedZoneResult {
  if (!geo || geo.lat === null || geo.lon === null) {
    return { blocked: false, distanceMiles: null };
  }

  const distance = haversineDistanceMiles(geo.lat, geo.lon, DFW_LAT, DFW_LON);
  return {
    blocked: distance <= RESTRICTED_RADIUS_MILES,
    distanceMiles: Math.round(distance),
  };
}

export { RESTRICTED_RADIUS_MILES };
