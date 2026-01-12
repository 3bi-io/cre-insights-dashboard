/**
 * Authentication recovery utilities
 * Handles clearing stale auth state and detecting auth-related errors
 */

const AUTH_STORAGE_KEY = 'supabase.auth.token';

/**
 * Clears all auth-related state from browser storage
 */
export function clearAuthState(): void {
  const timestamp = new Date().toISOString();
  console.log(`[AUTH_RECOVERY][${timestamp}] clearAuthState - starting cleanup`);
  
  try {
    // Clear Supabase auth token
    const hadToken = !!localStorage.getItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    console.log(`[AUTH_RECOVERY][${timestamp}] clearAuthState - main token removed:`, { hadToken });
    
    // Clear any session tracking
    sessionStorage.removeItem('session_id');
    sessionStorage.removeItem('session_start');
    console.log(`[AUTH_RECOVERY][${timestamp}] clearAuthState - session tracking cleared`);
    
    // Clear any other potential auth artifacts
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log(`[AUTH_RECOVERY][${timestamp}] clearAuthState - completed`, { 
      additionalKeysRemoved: keysToRemove.length,
      keys: keysToRemove 
    });
  } catch (error) {
    console.error(`[AUTH_RECOVERY][${timestamp}] clearAuthState - error:`, error);
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
  const timestamp = new Date().toISOString();
  console.log(`[AUTH_RECOVERY][${timestamp}] hasValidStoredToken - checking token validity`);
  
  try {
    const storedToken = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedToken) {
      console.log(`[AUTH_RECOVERY][${timestamp}] hasValidStoredToken - no token found`);
      return false;
    }
    
    console.log(`[AUTH_RECOVERY][${timestamp}] hasValidStoredToken - token exists, parsing...`);
    const parsed = JSON.parse(storedToken);
    
    // Check if it has the expected structure
    if (!parsed || typeof parsed !== 'object') {
      console.log(`[AUTH_RECOVERY][${timestamp}] hasValidStoredToken - invalid structure`);
      return false;
    }
    
    // Check for access token
    if (!parsed.access_token) {
      console.log(`[AUTH_RECOVERY][${timestamp}] hasValidStoredToken - missing access_token`);
      return false;
    }
    
    // Check if refresh token exists
    if (!parsed.refresh_token) {
      console.log(`[AUTH_RECOVERY][${timestamp}] hasValidStoredToken - missing refresh_token`);
      return false;
    }
    
    // Check expiry - if we have expires_at, verify it's in the future
    if (parsed.expires_at) {
      const expiresAt = new Date(parsed.expires_at * 1000);
      const now = new Date();
      
      // If token expired more than 24 hours ago, consider it stale
      const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours
      const timeSinceExpiry = now.getTime() - expiresAt.getTime();
      
      console.log(`[AUTH_RECOVERY][${timestamp}] hasValidStoredToken - expiry check`, {
        expiresAt: expiresAt.toISOString(),
        now: now.toISOString(),
        isExpired: timeSinceExpiry > 0,
        hoursSinceExpiry: Math.round(timeSinceExpiry / (60 * 60 * 1000))
      });
      
      if (timeSinceExpiry > staleThreshold) {
        console.log(`[AUTH_RECOVERY][${timestamp}] hasValidStoredToken - token is stale (expired > 24h ago)`);
        return false;
      }
    }
    
    console.log(`[AUTH_RECOVERY][${timestamp}] hasValidStoredToken - token is valid`);
    return true;
  } catch (error) {
    console.error(`[AUTH_RECOVERY][${timestamp}] hasValidStoredToken - error parsing token:`, error);
    return false;
  }
}

/**
 * Proactively clears corrupted auth state
 * Call this on app startup before initializing auth
 */
export function cleanupCorruptedAuthState(): boolean {
  const timestamp = new Date().toISOString();
  console.log(`[AUTH_RECOVERY][${timestamp}] cleanupCorruptedAuthState - starting proactive cleanup check`);
  
  try {
    const storedToken = localStorage.getItem(AUTH_STORAGE_KEY);
    
    if (!storedToken) {
      console.log(`[AUTH_RECOVERY][${timestamp}] cleanupCorruptedAuthState - no token found, nothing to clean`);
      return false;
    }
    
    console.log(`[AUTH_RECOVERY][${timestamp}] cleanupCorruptedAuthState - token found, validating...`);
    
    // Try to parse - if it fails, it's corrupted
    try {
      JSON.parse(storedToken);
      console.log(`[AUTH_RECOVERY][${timestamp}] cleanupCorruptedAuthState - token is valid JSON`);
    } catch (parseError) {
      console.warn(`[AUTH_RECOVERY][${timestamp}] cleanupCorruptedAuthState - found corrupted token (invalid JSON), clearing...`);
      clearAuthState();
      return true;
    }
    
    // Check if token is valid
    if (!hasValidStoredToken()) {
      console.warn(`[AUTH_RECOVERY][${timestamp}] cleanupCorruptedAuthState - found invalid/stale token, clearing...`);
      clearAuthState();
      return true;
    }
    
    console.log(`[AUTH_RECOVERY][${timestamp}] cleanupCorruptedAuthState - token is valid, no cleanup needed`);
    return false;
  } catch (error) {
    console.error(`[AUTH_RECOVERY][${timestamp}] cleanupCorruptedAuthState - error during cleanup:`, error);
    return false;
  }
}
