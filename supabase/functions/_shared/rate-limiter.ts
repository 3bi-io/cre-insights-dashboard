/**
 * Rate Limiting Utilities for Edge Functions
 * Provides flexible rate limiting using Deno KV
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
    const kv = await Deno.openKv();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get current count
    const result = await kv.get([key]);
    const data = result.value as { count: number; resetAt: number } | null;

    // Reset if window expired
    if (!data || data.resetAt < now) {
      const resetAt = now + windowMs;
      await kv.set([key], { count: 1, resetAt }, { expireIn: windowMs });

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
    await kv.set([key], { count: data.count + 1, resetAt: data.resetAt }, { 
      expireIn: data.resetAt - now 
    });

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
