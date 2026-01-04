import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Rate Limiter Unit Tests
 * Tests the in-memory rate limiting logic
 */

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

// Mock rate limit store for testing
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimitMock(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }
): RateLimitResult {
  const { maxRequests, windowMs, keyPrefix = 'ratelimit' } = config;
  const key = `${keyPrefix}:${identifier}`;
  const now = Date.now();

  const data = rateLimitStore.get(key);

  if (!data || data.resetAt < now) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt,
    };
  }

  if (data.count >= maxRequests) {
    const retryAfter = Math.ceil((data.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: data.resetAt,
      retryAfter,
    };
  }

  rateLimitStore.set(key, { count: data.count + 1, resetAt: data.resetAt });

  return {
    allowed: true,
    remaining: maxRequests - data.count - 1,
    resetAt: data.resetAt,
  };
}

describe('Rate Limiter', () => {
  beforeEach(() => {
    rateLimitStore.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests within limit', () => {
    const config: RateLimitConfig = { maxRequests: 5, windowMs: 60000 };
    
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimitMock('test-user', config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }
  });

  it('should block requests exceeding limit', () => {
    const config: RateLimitConfig = { maxRequests: 3, windowMs: 60000 };
    
    // Exhaust the limit
    for (let i = 0; i < 3; i++) {
      checkRateLimitMock('test-user', config);
    }

    // Next request should be blocked
    const result = checkRateLimitMock('test-user', config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeDefined();
  });

  it('should reset after window expires', () => {
    const config: RateLimitConfig = { maxRequests: 2, windowMs: 1000 };
    
    // Exhaust the limit
    checkRateLimitMock('test-user', config);
    checkRateLimitMock('test-user', config);
    
    let result = checkRateLimitMock('test-user', config);
    expect(result.allowed).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(1001);

    // Should be allowed again
    result = checkRateLimitMock('test-user', config);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('should track different identifiers separately', () => {
    const config: RateLimitConfig = { maxRequests: 2, windowMs: 60000 };
    
    // Exhaust limit for user1
    checkRateLimitMock('user1', config);
    checkRateLimitMock('user1', config);
    
    // user1 should be blocked
    let result = checkRateLimitMock('user1', config);
    expect(result.allowed).toBe(false);

    // user2 should still be allowed
    result = checkRateLimitMock('user2', config);
    expect(result.allowed).toBe(true);
  });

  it('should use custom key prefix', () => {
    const config1: RateLimitConfig = { maxRequests: 1, windowMs: 60000, keyPrefix: 'api' };
    const config2: RateLimitConfig = { maxRequests: 1, windowMs: 60000, keyPrefix: 'webhook' };
    
    // Exhaust api limit
    checkRateLimitMock('user', config1);
    let result = checkRateLimitMock('user', config1);
    expect(result.allowed).toBe(false);

    // webhook should still be allowed (different prefix)
    result = checkRateLimitMock('user', config2);
    expect(result.allowed).toBe(true);
  });

  it('should return correct retry-after value', () => {
    const config: RateLimitConfig = { maxRequests: 1, windowMs: 30000 };
    
    checkRateLimitMock('test-user', config);
    
    // Advance time by 10 seconds
    vi.advanceTimersByTime(10000);
    
    const result = checkRateLimitMock('test-user', config);
    expect(result.allowed).toBe(false);
    // Should be approximately 20 seconds remaining
    expect(result.retryAfter).toBeGreaterThanOrEqual(19);
    expect(result.retryAfter).toBeLessThanOrEqual(21);
  });
});
