/**
 * Geo-Check Edge Function
 * Validates visitor geographic location for access control
 * Protects PII by restricting access to North/South America only
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { createLogger } from '../_shared/logger.ts';
import { extractIPFromRequest, getGeoLocation } from '../_shared/geo-lookup.ts';
import { checkGeoAccess, getAllowedRegionsDescription, GeoBlockResult } from '../_shared/geo-blocking.ts';

const logger = createLogger('geo-check');

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    // Extract IP from request
    const ip = extractIPFromRequest(req);
    logger.info('Geo check request', { ip: ip.substring(0, 10) + '***' });

    // Perform geo lookup
    const geo = await getGeoLocation(ip);
    
    // Check access
    const result: GeoBlockResult = checkGeoAccess(geo);
    
    const duration = Date.now() - startTime;
    logger.info('Geo check complete', { 
      allowed: result.allowed, 
      countryCode: result.countryCode,
      reason: result.reason,
      duration_ms: duration 
    });

    // Return response with access decision
    return new Response(
      JSON.stringify({
        ...result,
        allowedRegions: result.allowed ? undefined : getAllowedRegionsDescription(),
        checkedAt: new Date().toISOString(),
      }),
      {
        status: result.allowed ? 200 : 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Geo check error', error);
    
    // Fail closed - block access on error for PII protection
    return new Response(
      JSON.stringify({
        allowed: false,
        countryCode: null,
        country: null,
        reason: 'lookup_failed',
        message: 'Unable to verify your location. Please try again later.',
        allowedRegions: getAllowedRegionsDescription(),
      }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
