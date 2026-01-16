/**
 * Authentication recovery utilities
 * Handles clearing stale auth state and detecting auth-related errors
 */

import { logger } from '@/lib/logger';

const AUTH_STORAGE_KEY = 'supabase.auth.token';

/**
 * Clears all auth-related state from browser storage
 */
export function clearAuthState(): void {
  logger.debug('clearAuthState - starting cleanup', { context: 'AUTH_RECOVERY' });
  
  try {
    // Clear Supabase auth token
    const hadToken = !!localStorage.getItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    logger.debug('clearAuthState - main token removed', { hadToken, context: 'AUTH_RECOVERY' });
    
    // Clear any session tracking
    sessionStorage.removeItem('session_id');
    sessionStorage.removeItem('session_start');
    
    // Clear any other potential auth artifacts
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    logger.debug('clearAuthState - completed', { 
      additionalKeysRemoved: keysToRemove.length,
      keys: keysToRemove,
      context: 'AUTH_RECOVERY'
    });
  } catch (error) {
    logger.error('clearAuthState - error', error, { context: 'AUTH_RECOVERY' });
  }
}

/**
 * Checks if an error is authentication-related
 */
export function isAuthError(error: Error | unknown): boolean {
  if (!error) return false;
  
  const message = error instanceof Error 
    ? error.message?.toLowerCase() || ''
    : String(error).toLowerCase();
  
  const authErrorPatterns = [
    'refresh_token',
    'refresh token',
    'session_expired',
    'session expired',
    'invalid_grant',
    'invalid grant',
    'jwt',
    'token',
    'unauthorized',
    'auth',
    'not authenticated',
    'session not found',
    'user not found',
  ];
  
  return authErrorPatterns.some(pattern => message.includes(pattern));
}

/**
 * Validates if stored auth token appears valid
 * Returns false if token is corrupted or clearly expired
 */
export function hasValidStoredToken(): boolean {
  logger.debug('hasValidStoredToken - checking token validity', { context: 'AUTH_RECOVERY' });
  
  try {
    const storedToken = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedToken) {
      logger.debug('hasValidStoredToken - no token found', { context: 'AUTH_RECOVERY' });
      return false;
    }
    
    const parsed = JSON.parse(storedToken);
    
    // Check if it has the expected structure
    if (!parsed || typeof parsed !== 'object') {
      logger.debug('hasValidStoredToken - invalid structure', { context: 'AUTH_RECOVERY' });
      return false;
    }
    
    // Check for access token
    if (!parsed.access_token) {
      logger.debug('hasValidStoredToken - missing access_token', { context: 'AUTH_RECOVERY' });
      return false;
    }
    
    // Check if refresh token exists
    if (!parsed.refresh_token) {
      logger.debug('hasValidStoredToken - missing refresh_token', { context: 'AUTH_RECOVERY' });
      return false;
    }
    
    // Check expiry - if we have expires_at, verify it's in the future
    if (parsed.expires_at) {
      const expiresAt = new Date(parsed.expires_at * 1000);
      const now = new Date();
      
      // If token expired more than 24 hours ago, consider it stale
      const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours
      const timeSinceExpiry = now.getTime() - expiresAt.getTime();
      
      logger.debug('hasValidStoredToken - expiry check', {
        expiresAt: expiresAt.toISOString(),
        now: now.toISOString(),
        isExpired: timeSinceExpiry > 0,
        hoursSinceExpiry: Math.round(timeSinceExpiry / (60 * 60 * 1000)),
        context: 'AUTH_RECOVERY'
      });
      
      if (timeSinceExpiry > staleThreshold) {
        logger.debug('hasValidStoredToken - token is stale (expired > 24h ago)', { context: 'AUTH_RECOVERY' });
        return false;
      }
    }
    
    logger.debug('hasValidStoredToken - token is valid', { context: 'AUTH_RECOVERY' });
    return true;
  } catch (error) {
    logger.error('hasValidStoredToken - error parsing token', error, { context: 'AUTH_RECOVERY' });
    return false;
  }
}

/**
 * Proactively clears corrupted auth state
 * Call this on app startup before initializing auth
 */
export function cleanupCorruptedAuthState(): boolean {
  logger.debug('cleanupCorruptedAuthState - starting proactive cleanup check', { context: 'AUTH_RECOVERY' });
  
  try {
    const storedToken = localStorage.getItem(AUTH_STORAGE_KEY);
    
    if (!storedToken) {
      logger.debug('cleanupCorruptedAuthState - no token found, nothing to clean', { context: 'AUTH_RECOVERY' });
      return false;
    }
    
    logger.debug('cleanupCorruptedAuthState - token found, validating...', { context: 'AUTH_RECOVERY' });
    
    // Try to parse - if it fails, it's corrupted
    try {
      JSON.parse(storedToken);
    } catch {
      logger.warn('cleanupCorruptedAuthState - found corrupted token (invalid JSON), clearing...', { context: 'AUTH_RECOVERY' });
      clearAuthState();
      return true;
    }
    
    // Check if token is valid
    if (!hasValidStoredToken()) {
      logger.warn('cleanupCorruptedAuthState - found invalid/stale token, clearing...', { context: 'AUTH_RECOVERY' });
      clearAuthState();
      return true;
    }
    
    logger.debug('cleanupCorruptedAuthState - token is valid, no cleanup needed', { context: 'AUTH_RECOVERY' });
    return false;
  } catch (error) {
    logger.error('cleanupCorruptedAuthState - error during cleanup', error, { context: 'AUTH_RECOVERY' });
    return false;
  }
}
