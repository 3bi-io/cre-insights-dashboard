/**
 * Geo-Blocking Configuration — OFAC Sanctions Compliance
 * Block-list approach: allow the world, block US-sanctioned countries only.
 *
 * Reference: https://ofac.treasury.gov/sanctions-programs-and-country-information
 * IMPORTANT: The OFAC list changes. Review periodically to keep this list current.
 */

import { createLogger } from './logger.ts';
import { GeoLocation } from './geo-lookup.ts';

const logger = createLogger('geo-blocking');

/**
 * OFAC-sanctioned countries subject to comprehensive/critical US embargoes.
 * Only countries with COUNTRY-WIDE bans are listed here (not SDN-targeted lists).
 *
 * Blocked:
 *   RU — Russia         (Critical / Hybrid Embargo)
 *   IR — Iran           (Full Embargo)
 *   CU — Cuba           (Full Embargo — note: was incorrectly on allow-list previously)
 *   KP — North Korea    (Full Embargo)
 *   SY — Syria          (Full Embargo)
 *   BY — Belarus        (Highly Restrictive)
 *
 * NOT blocked (SDN/targeted, not country-wide):
 *   YE — Yemen, SD — Sudan, ZW — Zimbabwe, AF — Afghanistan, VE — Venezuela
 *
 * Crimea / DNR / LNR: Cannot be reliably blocked by country code.
 * Geo-IP databases return UA (Ukraine) for these occupied territories.
 * No country-code-based solution exists for sub-national blocking.
 */
export const BLOCKED_COUNTRY_CODES = new Set([
  'RU', // Russia
  'IR', // Iran
  'CU', // Cuba
  'KP', // North Korea
  'SY', // Syria
  'BY', // Belarus
]);

/**
 * Check if a country code is on the OFAC sanctions block list
 */
export function isCountryBlocked(countryCode: string | null | undefined): boolean {
  if (!countryCode) return false;
  return BLOCKED_COUNTRY_CODES.has(countryCode.toUpperCase());
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
 * Check if a geo location is allowed access.
 * Policy: ALLOW all countries EXCEPT those on the OFAC sanctions block list.
 * Fail-open: if geo lookup fails or country is unknown, allow access.
 */
export function checkGeoAccess(geo: GeoLocation | null): GeoBlockResult {
  // If geo lookup failed — fail open (open-world policy, not PII-restricted)
  if (!geo || !geo.success) {
    logger.warn('Geo lookup failed - failing open (sanctions block-list policy)', { geo });
    return {
      allowed: true,
      countryCode: null,
      country: null,
      reason: 'lookup_failed',
    };
  }

  const countryCode = geo.countryCode?.toUpperCase() || null;
  const country = geo.country || null;

  // Unknown location — fail open
  if (!countryCode) {
    logger.warn('No country code in geo response - failing open', { geo });
    return {
      allowed: true,
      countryCode: null,
      country: null,
      reason: 'unknown_location',
    };
  }

  // Check OFAC sanctions block list
  if (isCountryBlocked(countryCode)) {
    logger.warn('Access blocked - OFAC sanctioned country', { countryCode, country });
    return {
      allowed: false,
      countryCode,
      country,
      reason: 'blocked_region',
      message: `Access is not available in ${country || countryCode} due to US sanctions compliance requirements.`,
    };
  }

  logger.debug('Access allowed', { countryCode, country });
  return {
    allowed: true,
    countryCode,
    country,
    reason: 'allowed',
  };
}

/**
 * Get a description of blocked regions for the blocked-access page
 */
export function getAllowedRegionsDescription(): string {
  return 'All countries except those subject to US OFAC sanctions (Russia, Iran, Cuba, North Korea, Syria, and Belarus)';
}
