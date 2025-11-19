/**
 * Centralized CORS configuration for all edge functions
 * Add production and preview domains here
 */
export const ALLOWED_ORIGINS = [
  // Production domains
  'https://ats.me',
  'https://www.ats.me',
  
  // Supabase project URL
  'https://auwhcdpppldjlcaxzsme.supabase.co',
  
  // Local development
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
];

/**
 * Check if origin is from Lovable preview environment
 */
export function isLovablePreview(origin: string): boolean {
  return origin.includes('lovable.app') || origin.includes('lovable.dev');
}

/**
 * Get CORS headers with flexible origin validation
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const isExplicitlyAllowed = origin && ALLOWED_ORIGINS.some(allowed => 
    origin.startsWith(allowed)
  );
  
  const isPreview = origin && isLovablePreview(origin);
  
  const isAllowed = isExplicitlyAllowed || isPreview;
  
  console.log(`[CORS] Request from origin: ${origin}, explicitly allowed: ${isExplicitlyAllowed}, preview: ${isPreview}, final allowed: ${isAllowed}`);
  
  return {
    'Access-Control-Allow-Origin': isAllowed && origin ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  };
}
