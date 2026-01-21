/**
 * Geo-Blocking Configuration for PII Protection
 * Restricts access to North and South America only
 */

import { createLogger } from './logger.ts';
import { GeoLocation } from './geo-lookup.ts';

const logger = createLogger('geo-blocking');

/**
 * Complete list of allowed country codes (ISO 3166-1 Alpha-2)
 * North America + Central America + Caribbean + South America
 */
export const ALLOWED_COUNTRY_CODES = new Set([
  // North America - Core
  'US', // United States
  'CA', // Canada
  'MX', // Mexico
  'GL', // Greenland
  
  // Central America
  'BZ', // Belize
  'CR', // Costa Rica
  'SV', // El Salvador
  'GT', // Guatemala
  'HN', // Honduras
  'NI', // Nicaragua
  'PA', // Panama
  
  // Caribbean (all territories)
  'AG', // Antigua and Barbuda
  'AI', // Anguilla
  'AN', // Netherlands Antilles (legacy)
  'AW', // Aruba
  'BB', // Barbados
  'BL', // Saint Barthélemy
  'BM', // Bermuda
  'BQ', // Bonaire, Sint Eustatius and Saba
  'BS', // Bahamas
  'CU', // Cuba
  'CW', // Curaçao
  'DM', // Dominica
  'DO', // Dominican Republic
  'GD', // Grenada
  'GP', // Guadeloupe
  'HT', // Haiti
  'JM', // Jamaica
  'KN', // Saint Kitts and Nevis
  'KY', // Cayman Islands
  'LC', // Saint Lucia
  'MF', // Saint Martin (French)
  'MQ', // Martinique
  'MS', // Montserrat
  'PM', // Saint Pierre and Miquelon
  'PR', // Puerto Rico
  'SX', // Sint Maarten (Dutch)
  'TC', // Turks and Caicos Islands
  'TT', // Trinidad and Tobago
  'VC', // Saint Vincent and the Grenadines
  'VG', // British Virgin Islands
  'VI', // U.S. Virgin Islands
  
  // South America
  'AR', // Argentina
  'BO', // Bolivia
  'BR', // Brazil
  'CL', // Chile
  'CO', // Colombia
  'EC', // Ecuador
  'FK', // Falkland Islands
  'GF', // French Guiana
  'GY', // Guyana
  'PY', // Paraguay
  'PE', // Peru
  'SR', // Suriname
  'UY', // Uruguay
  'VE', // Venezuela
]);

/**
 * Check if a country code is in the allowed list
 */
export function isCountryAllowed(countryCode: string | null | undefined): boolean {
  if (!countryCode) return false;
  return ALLOWED_COUNTRY_CODES.has(countryCode.toUpperCase());
}

/**
 * Validate geographic access and return detailed result
 */
export interface GeoBlockResult {
  allowed: boolean;
  countryCode: string | null;
  country: string | null;
  reason: 'allowed' | 'blocked_region' | 'lookup_failed' | 'unknown_location';
  message?: string;
}

/**
 * Check if a geo location is allowed access
 */
export function checkGeoAccess(geo: GeoLocation | null): GeoBlockResult {
  // If geo lookup failed, block access (fail-closed for PII protection)
  if (!geo || !geo.success) {
    logger.warn('Geo lookup failed - blocking access (fail-closed)', { geo });
    return {
      allowed: false,
      countryCode: null,
      country: null,
      reason: 'lookup_failed',
      message: 'Unable to verify your location. Access denied for security.',
    };
  }

  const countryCode = geo.countryCode?.toUpperCase() || null;
  const country = geo.country || null;

  if (!countryCode) {
    logger.warn('No country code in geo response - blocking access', { geo });
    return {
      allowed: false,
      countryCode: null,
      country: null,
      reason: 'unknown_location',
      message: 'Unable to determine your location. Access denied.',
    };
  }

  if (isCountryAllowed(countryCode)) {
    logger.debug('Access allowed', { countryCode, country });
    return {
      allowed: true,
      countryCode,
      country,
      reason: 'allowed',
    };
  }

  logger.warn('Access blocked - restricted region', { countryCode, country });
  return {
    allowed: false,
    countryCode,
    country,
    reason: 'blocked_region',
    message: `Access is not available in ${country || countryCode}. This platform is restricted to North and South America for data protection compliance.`,
  };
}

/**
 * Get a user-friendly region name for the allowed areas
 */
export function getAllowedRegionsDescription(): string {
  return 'North America (including Canada, USA, Mexico, Central America, and the Caribbean) and South America';
}
