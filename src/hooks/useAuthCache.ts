/**
 * Auth Cache Hook
 * Provides caching layer for auth operations to reduce Supabase calls
 */

import { useEffect, useCallback } from 'react';

import type { Organization } from '@/types/common.types';

interface CachedAuthData {
  userRole: string | null;
  organization: Organization | null;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'auth_cache';

/**
 * Get cached auth data if still valid
 */
export function getCachedAuthData(): CachedAuthData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedAuthData = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - data.timestamp < CACHE_DURATION) {
      return data;
    }

    // Cache expired, remove it
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    console.error('Error reading auth cache:', error);
    return null;
  }
}

/**
 * Set cached auth data
 */
export function setCachedAuthData(userRole: string | null, organization: Organization | null): void {
  try {
    const data: CachedAuthData = {
      userRole,
      organization,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error setting auth cache:', error);
  }
}

/**
 * Clear cached auth data
 */
export function clearAuthCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing auth cache:', error);
  }
}

/**
 * Hook to manage auth cache with automatic cleanup
 */
export function useAuthCache() {
  // Clear cache on unmount (logout)
  useEffect(() => {
    return () => {
      // Don't clear on unmount, only on explicit logout
    };
  }, []);

  const getCache = useCallback(getCachedAuthData, []);
  const setCache = useCallback(setCachedAuthData, []);
  const clearCache = useCallback(clearAuthCache, []);

  return {
    getCache,
    setCache,
    clearCache,
  };
}
