/**
 * Geo-Blocking Context Provider
 * Checks visitor location and blocks access from OFAC-sanctioned countries
 * and from within the DFW 200-mile restricted zone.
 * Open-world policy: allow all countries by default, block only sanctioned ones.
 * Non-Americas users get simulation mode on apply pages (cannot submit real applications).
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

// All ISO 3166-1 alpha-2 codes considered part of the Americas
const AMERICAS_COUNTRY_CODES = new Set([
  // North America
  'US', 'CA', 'MX', 'GT', 'BZ', 'HN', 'SV', 'NI', 'CR', 'PA',
  // Caribbean
  'JM', 'HT', 'DO', 'PR', 'TT', 'BB', 'LC', 'VC', 'GD', 'AG', 'KN',
  'BS', 'TC', 'KY', 'VG', 'VI', 'AW', 'CW', 'BQ', 'MF', 'SX', 'AI',
  'MS', 'GP', 'MQ', 'BL', 'DM',
  // South America
  'CO', 'VE', 'GY', 'SR', 'BR', 'EC', 'PE', 'BO', 'CL', 'AR', 'UY',
  'PY', 'FK', 'GF',
  // Other geographically Americas
  'GL',
]);
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface GeoBlockingState {
  isChecking: boolean;
  isBlocked: boolean;
  /** True when country is known and NOT in the Americas — triggers simulation mode on apply pages */
  isOutsideAmericas: boolean;
  /** True when user is inside the DFW 200-mile restricted zone */
  isInsideRestrictedZone: boolean;
  countryCode: string | null;
  country: string | null;
  reason: string | null;
  message: string | null;
  allowedRegions: string | null;
  distanceMiles: number | null;
  restrictedRadiusMiles: number | null;
}

interface GeoBlockingContextType extends GeoBlockingState {
  recheckLocation: () => Promise<void>;
  /** Super-admin dev toggle: forces simulation mode without altering real geo detection */
  simulationModeOverride: boolean;
  setSimulationOverride: (enabled: boolean) => void;
}

const GeoBlockingContext = createContext<GeoBlockingContextType | null>(null);

const CACHE_KEY = 'geo_blocking_result';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CachedResult {
  state: GeoBlockingState;
  expiresAt: number;
}

const SIM_OVERRIDE_KEY = 'geo_sim_override';

export function GeoBlockingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GeoBlockingState>({
    isChecking: true,
    isBlocked: false,
    isOutsideAmericas: false,
    isInsideRestrictedZone: false,
    countryCode: null,
    country: null,
    reason: null,
    message: null,
    allowedRegions: null,
    distanceMiles: null,
    restrictedRadiusMiles: null,
  });

  const [simulationModeOverride, setSimulationModeOverride] = useState<boolean>(() => {
    try { return localStorage.getItem(SIM_OVERRIDE_KEY) === 'true'; } catch { return false; }
  });

  const setSimulationOverride = useCallback((enabled: boolean) => {
    try { localStorage.setItem(SIM_OVERRIDE_KEY, String(enabled)); } catch { /* noop */ }
    setSimulationModeOverride(enabled);
  }, []);

  const checkLocation = useCallback(async () => {
    // Check session cache first
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CachedResult = JSON.parse(cached);
        if (parsed.expiresAt > Date.now()) {
          logger.debug('Using cached geo-blocking result', { context: 'GeoBlocking' });
          setState(parsed.state);
          return;
        }
        // Cache expired, remove it
        sessionStorage.removeItem(CACHE_KEY);
      }
    } catch {
      // Ignore cache errors
    }

    setState(prev => ({ ...prev, isChecking: true }));

    try {
      const { data, error } = await supabase.functions.invoke('geo-check', {
        method: 'GET',
      });

      if (error) {
        logger.warn('Geo-check function error — failing open (OFAC block-list policy)', { context: 'GeoBlocking' });
        const allowedState: GeoBlockingState = {
          isChecking: false,
          isBlocked: false,
          isOutsideAmericas: false,
          isInsideRestrictedZone: false,
          countryCode: null,
          country: null,
          reason: 'lookup_failed',
          message: null,
          allowedRegions: null,
          distanceMiles: null,
          restrictedRadiusMiles: null,
        };
        setState(allowedState);
        return;
      }

      const result = data as {
        allowed: boolean;
        countryCode: string | null;
        country: string | null;
        reason: string;
        message?: string;
        blockedRegions?: string;
        distanceMiles?: number | null;
        restrictedRadiusMiles?: number | null;
      };

      const resolvedCode = result.countryCode;
      const isOutsideAmericas = resolvedCode !== null && !AMERICAS_COUNTRY_CODES.has(resolvedCode);

      const newState: GeoBlockingState = {
        isChecking: false,
        isBlocked: !result.allowed,
        isOutsideAmericas,
        isInsideRestrictedZone: result.reason === 'inside_restricted_zone',
        countryCode: resolvedCode,
        country: result.country,
        reason: result.reason,
        message: result.message || null,
        allowedRegions: result.blockedRegions || null,
        distanceMiles: result.distanceMiles ?? null,
        restrictedRadiusMiles: result.restrictedRadiusMiles ?? null,
      };

      setState(newState);

      // Cache the result
      try {
        const cacheEntry: CachedResult = {
          state: newState,
          expiresAt: Date.now() + CACHE_TTL_MS,
        };
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
      } catch {
        // Ignore cache errors
      }

      if (!result.allowed) {
        logger.warn('Access blocked', { 
          reason: result.reason,
          countryCode: result.countryCode,
          country: result.country,
          context: 'GeoBlocking' 
        });
      }
    } catch (err) {
      logger.warn('Geo-check request failed — failing open (OFAC block-list policy)', { context: 'GeoBlocking' });
      setState({
        isChecking: false,
        isBlocked: false,
        isOutsideAmericas: false,
        isInsideRestrictedZone: false,
        countryCode: null,
        country: null,
        reason: 'lookup_failed',
        message: null,
        allowedRegions: null,
        distanceMiles: null,
        restrictedRadiusMiles: null,
      });
    }
  }, []);

  useEffect(() => {
    checkLocation();
  }, [checkLocation]);

  const value: GeoBlockingContextType = {
    ...state,
    // Override isOutsideAmericas when super-admin simulation toggle is active
    isOutsideAmericas: simulationModeOverride || state.isOutsideAmericas,
    recheckLocation: checkLocation,
    simulationModeOverride,
    setSimulationOverride,
  };

  return (
    <GeoBlockingContext.Provider value={value}>
      {children}
    </GeoBlockingContext.Provider>
  );
}

export function useGeoBlocking() {
  const context = useContext(GeoBlockingContext);
  if (!context) {
    throw new Error('useGeoBlocking must be used within a GeoBlockingProvider');
  }
  return context;
}
