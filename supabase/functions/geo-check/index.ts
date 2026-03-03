/**
 * Geo-Check Edge Function
 * Validates visitor geographic location for OFAC sanctions compliance
 * and DFW 200-mile service area restriction.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { createLogger } from '../_shared/logger.ts';
import { extractIPFromRequest, getGeoLocation } from '../_shared/geo-lookup.ts';
import { checkGeoAccess, getAllowedRegionsDescription, GeoBlockResult } from '../_shared/geo-blocking.ts';
import { isWithinServiceArea, ALLOWED_RADIUS_MILES } from '../_shared/geo-fence.ts';

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
    
    // Gate 1: Check against OFAC sanctions block list
    const result: GeoBlockResult = checkGeoAccess(geo);
    
    if (!result.allowed) {
      const duration = Date.now() - startTime;
      logger.info('Geo check blocked (OFAC)', { countryCode: result.countryCode, duration_ms: duration });
      return new Response(
        JSON.stringify({
          ...result,
          blockedRegions: getAllowedRegionsDescription(),
          checkedAt: new Date().toISOString(),
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Gate 2: DFW 200-mile service area check
    const serviceArea = isWithinServiceArea(geo);

    if (!serviceArea.allowed) {
      const duration = Date.now() - startTime;
      logger.info('Geo check blocked (service area)', {
        countryCode: result.countryCode,
        distanceMiles: serviceArea.distanceMiles,
        duration_ms: duration,
      });
      return new Response(
        JSON.stringify({
          allowed: false,
          countryCode: result.countryCode,
          country: result.country,
          reason: 'outside_service_area',
          distanceMiles: serviceArea.distanceMiles,
          serviceAreaRadiusMiles: ALLOWED_RADIUS_MILES,
          checkedAt: new Date().toISOString(),
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Allowed
    const duration = Date.now() - startTime;
    logger.info('Geo check complete', { 
      allowed: true, 
      countryCode: result.countryCode,
      distanceMiles: serviceArea.distanceMiles,
      duration_ms: duration 
    });

    return new Response(
      JSON.stringify({
        ...result,
        distanceMiles: serviceArea.distanceMiles,
        checkedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Geo check error', error);
    
    // Fail open — on error, allow access
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
