/**
 * Centralized CORS Configuration for Edge Functions
 * 
 * This is the SINGLE source of truth for CORS handling.
 * All edge functions should import from this file.
 * 
 * Migration note: cors.ts has been merged into this file.
 * The old cors.ts exports are re-exported for backwards compatibility.
 */

// ============ Allowed Origins ============

export const ALLOWED_ORIGINS = [
  // Production domains
  'https://ats.me',
  'https://www.ats.me',
  'https://ats-me.lovable.app',
  
  // Supabase project URL
  'https://auwhcdpppldjlcaxzsme.supabase.co',
  
  // Local development
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
];

// ============ Origin Validation ============

/**
 * Check if origin is from Lovable preview environment
 */
export function isLovablePreview(origin: string): boolean {
  return origin.includes('lovable.app') || 
         origin.includes('lovable.dev') || 
         origin.includes('lovableproject.com');
}

/**
 * Check if origin is explicitly allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  
  const isExplicitlyAllowed = ALLOWED_ORIGINS.some(allowed => 
    origin.startsWith(allowed)
  );
  
  return isExplicitlyAllowed || isLovablePreview(origin);
}

// ============ CORS Headers ============

/**
 * Get CORS headers with flexible origin validation
 * This is the primary function for CORS handling.
 * 
 * @param origin - The origin header from the request (req.headers.get('origin'))
 * @returns CORS headers object
 */
export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const isAllowed = origin && isOriginAllowed(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed && origin ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
}

/**
 * Default CORS headers for backwards compatibility
 * @deprecated Use getCorsHeaders(origin) instead for proper origin validation
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============ CORS Response Helpers ============

/**
 * Create a preflight response for OPTIONS requests
 */
export function createPreflightResponse(origin?: string | null): Response {
  return new Response(null, { 
    headers: getCorsHeaders(origin) 
  });
}

/**
 * Handle CORS preflight check - returns Response if OPTIONS, null otherwise
 */
export function handleCorsPreflightIfNeeded(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin');
    return createPreflightResponse(origin);
  }
  return null;
}
