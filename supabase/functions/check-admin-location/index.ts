// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowed locations for super admin access
const ALLOWED_LOCATIONS = {
  states: ['TX', 'Texas', 'LA', 'Louisiana', 'AL', 'Alabama', 'MS', 'Mississippi'],
  cities: ['Detroit']
};

/**
 * Check if super administrator is accessing from allowed geographic locations
 * Allowed: Texas, Louisiana, Alabama, Mississippi, or Detroit city
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from request headers
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    console.log('Checking location for IP:', clientIp);

    // For localhost/development, allow access
    if (clientIp === 'unknown' || clientIp.includes('127.0.0.1') || clientIp.includes('localhost')) {
      return new Response(
        JSON.stringify({ 
          allowed: true, 
          location: 'Development environment',
          ip: clientIp 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Call IP geolocation API (using ipapi.co free tier)
    const geoResponse = await fetch(`https://ipapi.co/${clientIp}/json/`);
    
    if (!geoResponse.ok) {
      console.error('Geolocation API error:', await geoResponse.text());
      // On API failure, deny access for security
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          error: 'Unable to verify location. Please contact support.',
          ip: clientIp 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const geoData = await geoResponse.json();
    console.log('Geolocation data:', geoData);

    const { city, region, region_code, country_code } = geoData;

    // Must be in USA
    if (country_code !== 'US') {
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          error: 'Super administrator access is restricted to specific US locations only.',
          location: `${city}, ${region}, ${country_code}`,
          ip: clientIp 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if in allowed states or Detroit
    const isAllowedState = ALLOWED_LOCATIONS.states.some(
      state => state.toLowerCase() === region?.toLowerCase() || 
               state === region_code
    );
    
    const isDetroit = city?.toLowerCase() === 'detroit';

    if (isAllowedState || isDetroit) {
      return new Response(
        JSON.stringify({ 
          allowed: true, 
          location: `${city}, ${region}`,
          ip: clientIp 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Access denied
    return new Response(
      JSON.stringify({ 
        allowed: false, 
        error: 'Super administrator access is only allowed from Texas, Louisiana, Alabama, Mississippi, or Detroit.',
        location: `${city}, ${region}`,
        ip: clientIp 
      }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Location check error:', error);
    return new Response(
      JSON.stringify({ 
        allowed: false, 
        error: 'Location verification failed. Please contact support.' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
