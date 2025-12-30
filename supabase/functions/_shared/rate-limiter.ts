/**
 * Rate Limiting Utilities for Edge Functions
 * Provides flexible rate limiting using in-memory Map
 * Note: Deno KV is not available in Supabase Edge Functions
 */

import { RateLimitError } from './error-handler.ts';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

// In-memory rate limit store
// Note: This resets when the function cold starts, but provides basic protection
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Cleanup old entries periodically to prevent memory leaks
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check rate limit for an identifier
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }
): Promise<RateLimitResult> {
  const { maxRequests, windowMs, keyPrefix = 'ratelimit' } = config;
  const key = `${keyPrefix}:${identifier}`;

  try {
    const now = Date.now();
    
    // Cleanup expired entries occasionally (1% chance per request)
    if (Math.random() < 0.01) {
      cleanupExpiredEntries();
    }

    // Get current count
    const data = rateLimitStore.get(key);

    // Reset if window expired or no data
    if (!data || data.resetAt < now) {
      const resetAt = now + windowMs;
      rateLimitStore.set(key, { count: 1, resetAt });

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt,
      };
    }

    // Check if limit exceeded
    if (data.count >= maxRequests) {
      const retryAfter = Math.ceil((data.resetAt - now) / 1000);
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: data.resetAt,
        retryAfter,
      };
    }

    // Increment counter
    rateLimitStore.set(key, { count: data.count + 1, resetAt: data.resetAt });

    return {
      allowed: true,
      remaining: maxRequests - data.count - 1,
      resetAt: data.resetAt,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // On error, allow the request but log the issue
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: Date.now() + windowMs,
    };
  }
}

/**
 * Middleware to enforce rate limiting
 */
export async function enforceRateLimit(
  identifier: string,
  config?: RateLimitConfig
): Promise<void> {
  const result = await checkRateLimit(identifier, config);

  if (!result.allowed) {
    throw new RateLimitError('Rate limit exceeded', result.retryAfter);
  }
}

/**
 * Get rate limit identifier from request
 */
export function getRateLimitIdentifier(req: Request, useAuth: boolean = false): string {
  if (useAuth) {
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      // Use a hash of the token as identifier
      const token = authHeader.replace('Bearer ', '');
      return `auth:${token.substring(0, 16)}`;
    }
  }

  // Fallback to IP address
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  
  return `ip:${ip}`;
}
