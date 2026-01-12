/**
 * Authentication recovery utilities
 * Handles clearing stale auth state and detecting auth-related errors
 */

const AUTH_STORAGE_KEY = 'supabase.auth.token';

/**
 * Clears all auth-related state from browser storage
 */
export function clearAuthState(): void {
  try {
    // Clear Supabase auth token
    localStorage.removeItem(AUTH_STORAGE_KEY);
    
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
    
    console.log('[AUTH_RECOVERY] Cleared auth state from storage');
  } catch (error) {
    console.error('[AUTH_RECOVERY] Error clearing auth state:', error);
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
  try {
    const storedToken = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedToken) return false;
    
    const parsed = JSON.parse(storedToken);
    
    // Check if it has the expected structure
    if (!parsed || typeof parsed !== 'object') return false;
    
    // Check for access token
    if (!parsed.access_token) return false;
    
    // Check if refresh token exists
    if (!parsed.refresh_token) return false;
    
    // Check expiry - if we have expires_at, verify it's in the future
    if (parsed.expires_at) {
      const expiresAt = new Date(parsed.expires_at * 1000);
      const now = new Date();
      
      // If token expired more than 24 hours ago, consider it stale
      const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours
      if (now.getTime() - expiresAt.getTime() > staleThreshold) {
        console.log('[AUTH_RECOVERY] Token is stale (expired > 24h ago)');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.log('[AUTH_RECOVERY] Error parsing stored token:', error);
    return false;
  }
}

/**
 * Proactively clears corrupted auth state
 * Call this on app startup before initializing auth
 */
export function cleanupCorruptedAuthState(): boolean {
  try {
    const storedToken = localStorage.getItem(AUTH_STORAGE_KEY);
    
    if (!storedToken) {
      return false; // No token to clean
    }
    
    // Try to parse - if it fails, it's corrupted
    try {
      JSON.parse(storedToken);
    } catch {
      console.log('[AUTH_RECOVERY] Found corrupted token, clearing...');
      clearAuthState();
      return true;
    }
    
    // Check if token is valid
    if (!hasValidStoredToken()) {
      console.log('[AUTH_RECOVERY] Found invalid/stale token, clearing...');
      clearAuthState();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[AUTH_RECOVERY] Error during cleanup:', error);
    return false;
  }
}
