/**
 * Geo-Check Edge Function
 * Validates visitor geographic location for OFAC sanctions compliance.
 * Open-world policy: allow all countries except OFAC-sanctioned ones.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { createLogger } from '../_shared/logger.ts';
import { extractIPFromRequest, getGeoLocation } from '../_shared/geo-lookup.ts';
import { checkGeoAccess, getAllowedRegionsDescription, GeoBlockResult } from '../_shared/geo-blocking.ts';

const logger = createLogger('geo-check');

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const referer = req.headers.get('referer') || '';
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Allow Lovable preview environments to bypass geo-blocking for development/testing
  const isLovablePreview = origin.includes('.lovable.app') || 
                           origin.includes('lovableproject.com') ||
                           referer.includes('.lovable.app') ||
                           referer.includes('lovableproject.com');

  if (isLovablePreview) {
    logger.info('Lovable preview detected - bypassing geo-check');
    return new Response(
      JSON.stringify({
        allowed: true,
        countryCode: 'US',
        country: 'United States (Preview)',
        reason: 'allowed',
        checkedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const startTime = Date.now();
  
  try {
    // Extract IP from request
    const ip = extractIPFromRequest(req);
    logger.info('Geo check request', { ip: ip.substring(0, 10) + '***' });

    // Perform geo lookup
    const geo = await getGeoLocation(ip);
    
    // Check against OFAC sanctions block list
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
        blockedRegions: result.allowed ? undefined : getAllowedRegionsDescription(),
        checkedAt: new Date().toISOString(),
      }),
      {
        status: result.allowed ? 200 : 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Geo check error', error);
    
    // Fail open — on error, allow access (open-world sanctions policy)
    return new Response(
      JSON.stringify({
        allowed: true,
        countryCode: null,
        country: null,
        reason: 'lookup_failed',
        checkedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
