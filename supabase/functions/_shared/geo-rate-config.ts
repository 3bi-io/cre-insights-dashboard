/**
 * Geographic Rate Limit Configuration
 * Defines elevated rate limits for developer/tester regions
 */

import { GeoLocation } from './geo-lookup.ts';

export interface GeoRateLimitOverride {
  id: string;
  regions: string[];           // State codes: ['TX', 'AL']
  cities?: string[];           // Optional city matching (case-insensitive)
  multiplier: number;          // e.g., 5x normal limits
  description: string;
}

/**
 * Geographic rate limit overrides
 * Users in these regions get elevated rate limits for testing
 */
export const GEO_RATE_OVERRIDES: GeoRateLimitOverride[] = [
  {
    id: 'alabama-devs',
    regions: ['AL'],
    multiplier: 5,
    description: 'Alabama developer testing - all users in Alabama',
  },
  {
    id: 'dfw-devs',
    regions: ['TX'],
    cities: [
      'Dallas',
      'Fort Worth',
      'Arlington',
      'Plano',
      'Irving',
      'Garland',
      'Frisco',
      'McKinney',
      'Denton',
      'Richardson',
      'Carrollton',
      'Grand Prairie',
      'Mesquite',
      'Lewisville',
      'Allen',
      'Flower Mound',
      'Euless',
      'Bedford',
      'Grapevine',
      'Hurst',
      'Keller',
      'Southlake',
      'Coppell',
      'Rowlett',
      'Wylie',
      'Rockwall',
      'The Colony',
      'Little Elm',
      'Mansfield',
      'Burleson',
      'Cedar Hill',
      'DeSoto',
      'Duncanville',
      'Lancaster',
      'Waxahachie',
      'Midlothian',
    ],
    multiplier: 5,
    description: 'Dallas-Fort Worth metro area developer testing',
  },
];

/**
 * Check if a geographic location matches any override rules
 * Returns the multiplier to apply (1 = no override)
 */
export function getGeoRateMultiplier(geo: GeoLocation | null): { multiplier: number; matchedRule: GeoRateLimitOverride | null } {
  if (!geo || !geo.success) {
    return { multiplier: 1, matchedRule: null };
  }

  // Only apply to US locations
  if (geo.countryCode !== 'US') {
    return { multiplier: 1, matchedRule: null };
  }

  for (const override of GEO_RATE_OVERRIDES) {
    // Check if region (state) matches
    if (!override.regions.includes(geo.region)) {
      continue;
    }

    // If cities are specified, check if city matches
    if (override.cities && override.cities.length > 0) {
      const cityLower = geo.city.toLowerCase();
      const cityMatch = override.cities.some(c => c.toLowerCase() === cityLower);
      
      if (!cityMatch) {
        continue;
      }
    }

    // Match found!
    return { multiplier: override.multiplier, matchedRule: override };
  }

  return { multiplier: 1, matchedRule: null };
}

/**
 * Apply geographic multiplier to a rate limit config
 */
export function applyGeoMultiplier(maxRequests: number, multiplier: number): number {
  return Math.floor(maxRequests * multiplier);
}
