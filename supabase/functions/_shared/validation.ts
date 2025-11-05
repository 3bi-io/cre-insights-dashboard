/**
 * Shared validation utilities for edge functions
 * Prevents injection attacks and ensures data integrity
 * 
 * IMPORTANT: For comprehensive validation, use securitySchemas.ts with Zod
 * This file provides basic regex-based validation for legacy compatibility
 */

// IP Address validation
const IP_V4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const IP_V6_REGEX = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;

// UUID validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Email validation (RFC 5322 simplified)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Validate IPv4 or IPv6 address format
 */
export function validateIpAddress(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  return IP_V4_REGEX.test(ip) || IP_V6_REGEX.test(ip);
}

/**
 * Validate UUID format
 */
export function validateUUID(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return UUID_REGEX.test(id);
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 255) return false;
  return EMAIL_REGEX.test(email);
}

/**
 * Sanitize input by removing potentially dangerous characters
 * Useful for preventing injection attacks
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validate and sanitize object with multiple fields
 */
export interface ValidationRule {
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: RegExp;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'uuid';
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  valid: boolean;
  errors: { [key: string]: string };
  sanitized: { [key: string]: any };
}

/**
 * Validate object against schema
 */
export function validateObject(
  data: any,
  schema: ValidationSchema
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: {},
    sanitized: {}
  };

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Check required
    if (rules.required && (value === undefined || value === null || value === '')) {
      result.valid = false;
      result.errors[field] = `${field} is required`;
      continue;
    }

    // Skip if not required and not present
    if (!rules.required && (value === undefined || value === null)) {
      continue;
    }

    // Type validation
    if (rules.type) {
      switch (rules.type) {
        case 'string':
          if (typeof value !== 'string') {
            result.valid = false;
            result.errors[field] = `${field} must be a string`;
            continue;
          }
          break;
        case 'number':
          if (typeof value !== 'number' && isNaN(Number(value))) {
            result.valid = false;
            result.errors[field] = `${field} must be a number`;
            continue;
          }
          result.sanitized[field] = Number(value);
          continue;
        case 'boolean':
          if (typeof value !== 'boolean') {
            result.valid = false;
            result.errors[field] = `${field} must be a boolean`;
            continue;
          }
          break;
        case 'email':
          if (!validateEmail(value)) {
            result.valid = false;
            result.errors[field] = `${field} must be a valid email`;
            continue;
          }
          break;
        case 'uuid':
          if (!validateUUID(value)) {
            result.valid = false;
            result.errors[field] = `${field} must be a valid UUID`;
            continue;
          }
          break;
      }
    }

    // String-specific validations
    if (typeof value === 'string') {
      // Min length
      if (rules.minLength && value.length < rules.minLength) {
        result.valid = false;
        result.errors[field] = `${field} must be at least ${rules.minLength} characters`;
        continue;
      }

      // Max length
      if (rules.maxLength && value.length > rules.maxLength) {
        result.valid = false;
        result.errors[field] = `${field} must be at most ${rules.maxLength} characters`;
        continue;
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        result.valid = false;
        result.errors[field] = `${field} format is invalid`;
        continue;
      }

      // Sanitize
      result.sanitized[field] = sanitizeInput(value, rules.maxLength || 1000);
    } else {
      result.sanitized[field] = value;
    }
  }

  return result;
}

/**
 * Rate limiting using Deno KV
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }
): Promise<{ allowed: boolean; remaining?: number; resetAt?: number }> {
  try {
    const kv = await Deno.openKv();
    const key = ['rate_limit', identifier];
    const now = Date.now();
    
    const entry = await kv.get(key);
    const data = entry.value as { count: number; resetAt: number } | null;
    
    if (data && data.resetAt > now) {
      if (data.count >= config.maxRequests) {
        return { allowed: false, resetAt: data.resetAt };
      }
      
      await kv.set(key, { count: data.count + 1, resetAt: data.resetAt });
      return { 
        allowed: true, 
        remaining: config.maxRequests - data.count - 1,
        resetAt: data.resetAt
      };
    }
    
    const resetAt = now + config.windowMs;
    await kv.set(key, { 
      count: 1, 
      resetAt 
    }, { expireIn: config.windowMs });
    
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  } catch (error) {
    console.error('[RATE_LIMIT] Error:', error);
    return { allowed: true };
  }
}
