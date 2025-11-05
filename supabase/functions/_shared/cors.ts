/**
 * CORS Utilities for Edge Functions
 * Provides standardized CORS headers and handling
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Get CORS headers with optional custom origin
 */
export function getCorsHeaders(origin?: string): Record<string, string> {
  if (origin) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Max-Age': '86400',
    };
  }
  return corsHeaders;
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPrelight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

/**
 * Middleware to wrap handler with CORS support
 */
export function withCors(
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    // Handle preflight
    const corsResponse = handleCorsPrelight(req);
    if (corsResponse) return corsResponse;

    // Execute handler
    const response = await handler(req);
    
    // Ensure CORS headers are present
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      if (!headers.has(key)) {
        headers.set(key, value);
      }
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}
