/**
 * IP Geolocation Utility for Edge Functions
 * Provides geographic location lookup with in-memory caching
 */

export interface GeoLocation {
  ip: string;
  city: string;
  region: string;       // State code (e.g., "TX", "AL")
  regionName: string;   // Full name (e.g., "Texas", "Alabama")
  country: string;
  countryCode: string;
  timezone: string;
  isp: string;
  success: boolean;
}

// In-memory cache for geo lookups (5-minute TTL)
const geoCache = new Map<string, { data: GeoLocation; expiresAt: number }>();
const GEO_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Clean up expired cache entries (called probabilistically)
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, value] of geoCache.entries()) {
    if (value.expiresAt < now) {
      geoCache.delete(key);
    }
  }
}

/**
 * Extract IP address from request headers
 */
export function extractIPFromRequest(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  
  return 'unknown';
}

/**
 * Look up geographic location for an IP address
 * Uses ip-api.com (free, no API key required, 45 req/min limit)
 * Results are cached to reduce API calls
 */
export async function getGeoLocation(ip: string): Promise<GeoLocation | null> {
  // Don't lookup localhost or unknown IPs
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return null;
  }

  // Check cache first
  const cached = geoCache.get(ip);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // Cleanup expired entries occasionally (1% chance per request)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }

  try {
    // Use ip-api.com for geolocation (free tier: 45 req/min)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,timezone,isp,query`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Geo lookup failed for ${ip}: HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.status !== 'success') {
      console.warn(`Geo lookup failed for ${ip}: ${data.message}`);
      return null;
    }

    const geoLocation: GeoLocation = {
      ip: data.query || ip,
      city: data.city || '',
      region: data.region || '',
      regionName: data.regionName || '',
      country: data.country || '',
      countryCode: data.countryCode || '',
      timezone: data.timezone || '',
      isp: data.isp || '',
      success: true,
    };

    // Cache the result
    geoCache.set(ip, {
      data: geoLocation,
      expiresAt: Date.now() + GEO_CACHE_TTL_MS,
    });

    return geoLocation;
  } catch (error) {
    // On error, fail silently - geo lookup is non-critical
    const isTimeout = (error as Error).name === 'AbortError';
    console.warn(`Geo lookup error for ${ip}: ${isTimeout ? 'timeout' : (error as Error).message}`);
    return null;
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getGeoCacheStats(): { size: number; entries: string[] } {
  return {
    size: geoCache.size,
    entries: Array.from(geoCache.keys()),
  };
}
