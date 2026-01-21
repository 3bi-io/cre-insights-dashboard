/**
 * Geo-Blocking Context Provider
 * Checks visitor location and blocks access from outside North/South America
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface GeoBlockingState {
  isChecking: boolean;
  isBlocked: boolean;
  countryCode: string | null;
  country: string | null;
  reason: string | null;
  message: string | null;
  allowedRegions: string | null;
}

interface GeoBlockingContextType extends GeoBlockingState {
  recheckLocation: () => Promise<void>;
}

const GeoBlockingContext = createContext<GeoBlockingContextType | null>(null);

const CACHE_KEY = 'geo_blocking_result';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CachedResult {
  state: GeoBlockingState;
  expiresAt: number;
}

export function GeoBlockingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GeoBlockingState>({
    isChecking: true,
    isBlocked: false,
    countryCode: null,
    country: null,
    reason: null,
    message: null,
    allowedRegions: null,
  });

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
        logger.error('Geo-check function error', error, { context: 'GeoBlocking' });
        // Fail closed - block on error
        const blockedState: GeoBlockingState = {
          isChecking: false,
          isBlocked: true,
          countryCode: null,
          country: null,
          reason: 'lookup_failed',
          message: 'Unable to verify your location. Please try again later.',
          allowedRegions: null,
        };
        setState(blockedState);
        return;
      }

      const result = data as {
        allowed: boolean;
        countryCode: string | null;
        country: string | null;
        reason: string;
        message?: string;
        allowedRegions?: string;
      };

      const newState: GeoBlockingState = {
        isChecking: false,
        isBlocked: !result.allowed,
        countryCode: result.countryCode,
        country: result.country,
        reason: result.reason,
        message: result.message || null,
        allowedRegions: result.allowedRegions || null,
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
        logger.warn('Access blocked - restricted region', { 
          countryCode: result.countryCode,
          country: result.country,
          context: 'GeoBlocking' 
        });
      }
    } catch (err) {
      logger.error('Geo-check request failed', err, { context: 'GeoBlocking' });
      // Fail closed
      setState({
        isChecking: false,
        isBlocked: true,
        countryCode: null,
        country: null,
        reason: 'lookup_failed',
        message: 'Unable to verify your location. Please try again later.',
        allowedRegions: null,
      });
    }
  }, []);

  useEffect(() => {
    checkLocation();
  }, [checkLocation]);

  const value: GeoBlockingContextType = {
    ...state,
    recheckLocation: checkLocation,
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
