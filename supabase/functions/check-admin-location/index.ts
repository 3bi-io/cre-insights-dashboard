// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Production-only allowed locations for super admin access
const ALLOWED_LOCATIONS = {
  states: ['TX', 'Texas', 'LA', 'Louisiana', 'AL', 'Alabama', 'MS', 'Mississippi'],
  cities: ['Detroit']
};

// IP validation regex (IPv4 and IPv6)
const IP_V4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const IP_V6_REGEX = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;

// Rate limiting using Deno KV (10 requests per IP per hour)
const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
};

/**
 * Validate IP address format
 */
function isValidIp(ip: string): boolean {
  if (!ip || ip === 'unknown') return false;
  return IP_V4_REGEX.test(ip) || IP_V6_REGEX.test(ip);
}

/**
 * Check rate limit for IP address
 */
async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining?: number }> {
  try {
    const kv = await Deno.openKv();
    const key = ['rate_limit', 'admin_location', ip];
    const now = Date.now();
    
    const entry = await kv.get(key);
    const data = entry.value as { count: number; resetAt: number } | null;
    
    if (data && data.resetAt > now) {
      if (data.count >= RATE_LIMIT.maxRequests) {
        return { allowed: false };
      }
      
      // Increment counter
      await kv.set(key, { count: data.count + 1, resetAt: data.resetAt });
      return { allowed: true, remaining: RATE_LIMIT.maxRequests - data.count - 1 };
    }
    
    // Create new rate limit window
    await kv.set(key, { 
      count: 1, 
      resetAt: now + RATE_LIMIT.windowMs 
    }, { expireIn: RATE_LIMIT.windowMs });
    
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1 };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open to prevent lockout, but log the error
    return { allowed: true };
  }
}

/**
 * Get cached geolocation data
 */
async function getCachedGeoData(ip: string): Promise<any | null> {
  try {
    const kv = await Deno.openKv();
    const key = ['geo_cache', ip];
    const entry = await kv.get(key);
    
    if (entry.value) {
      const data = entry.value as { geo: any; cachedAt: number };
      // Cache valid for 24 hours
      if (Date.now() - data.cachedAt < 24 * 60 * 60 * 1000) {
        return data.geo;
      }
    }
    return null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

/**
 * Cache geolocation data
 */
async function cacheGeoData(ip: string, geoData: any): Promise<void> {
  try {
    const kv = await Deno.openKv();
    const key = ['geo_cache', ip];
    await kv.set(key, {
      geo: geoData,
      cachedAt: Date.now()
    }, { expireIn: 24 * 60 * 60 * 1000 }); // 24 hours
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

/**
 * Log admin access attempt to audit logs
 */
async function logAccessAttempt(
  ip: string,
  allowed: boolean,
  location: string,
  userAgent: string,
  userId?: string
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    await supabase.from('audit_logs').insert({
      user_id: userId || null,
      organization_id: null,
      table_name: 'auth',
      record_id: userId || null,
      action: allowed ? 'SUPER_ADMIN_ACCESS_GRANTED' : 'SUPER_ADMIN_ACCESS_DENIED',
      sensitive_fields: ['location_check'],
      ip_address: ip,
      user_agent: userAgent
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

/**
 * Check if super administrator is accessing from allowed geographic locations
 * Production-only: Texas, Louisiana, Alabama, Mississippi, or Detroit city
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from request headers
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    console.log('[SECURITY] Admin location check for IP:', clientIp);

    // PRODUCTION SECURITY: No development bypass
    // Validate IP format
    if (!isValidIp(clientIp)) {
      await logAccessAttempt(clientIp, false, 'Invalid IP', userAgent);
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          error: 'Invalid IP address. Access denied for security.',
          ip: clientIp 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(clientIp);
    if (!rateLimitCheck.allowed) {
      await logAccessAttempt(clientIp, false, 'Rate limited', userAgent);
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          error: 'Too many requests. Please try again later.',
          ip: clientIp 
        }),
        {
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'Retry-After': '3600'
          },
        }
      );
    }

    // Try to get cached geolocation data
    let geoData = await getCachedGeoData(clientIp);
    
    if (!geoData) {
      // Call IP geolocation API (using ipapi.co free tier)
      const geoResponse = await fetch(`https://ipapi.co/${clientIp}/json/`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (!geoResponse.ok) {
        console.error('[SECURITY] Geolocation API error:', await geoResponse.text());
        await logAccessAttempt(clientIp, false, 'Geolocation API failure', userAgent);
        
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

      geoData = await geoResponse.json();
      
      // Cache the result
      await cacheGeoData(clientIp, geoData);
    }

    console.log('[SECURITY] Geolocation data:', geoData);

    const { city, region, region_code, country_code } = geoData;

    // Must be in USA
    if (country_code !== 'US') {
      await logAccessAttempt(clientIp, false, `${city}, ${region}, ${country_code}`, userAgent);
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
      await logAccessAttempt(clientIp, true, `${city}, ${region}`, userAgent);
      return new Response(
        JSON.stringify({ 
          allowed: true, 
          location: `${city}, ${region}`,
          ip: clientIp 
        }),
        {
          status: 200,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': rateLimitCheck.remaining?.toString() || '0'
          },
        }
      );
    }

    // Access denied
    await logAccessAttempt(clientIp, false, `${city}, ${region}`, userAgent);
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
    console.error('[SECURITY] Location check error:', error);
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
