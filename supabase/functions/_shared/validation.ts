/**
 * Unified Validation Module for Edge Functions
 * 
 * This module consolidates all validation utilities:
 * - Basic regex validation (IP, UUID, email)
 * - Schema-based validation with Zod
 * - Common helper functions
 * - Rate limiting
 * 
 * Migration note: validation-helpers.ts and validation-schemas.ts 
 * have been merged into this single file.
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// ============ Regex Patterns ============

const IP_V4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const IP_V6_REGEX = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============ Basic Validators ============

/**
 * Validate IPv4 or IPv6 address format
 */
export function validateIpAddress(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  return IP_V4_REGEX.test(ip) || IP_V6_REGEX.test(ip);
}

/**
 * Validate UUID format (both validateUUID and isValidUuid for compatibility)
 */
export function validateUUID(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return UUID_REGEX.test(id);
}

/** Alias for validateUUID for compatibility */
export const isValidUuid = validateUUID;

/**
 * Validate email format (strict RFC 5322)
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 255) return false;
  return EMAIL_REGEX.test(email);
}

/**
 * Validate email format (simple check)
 */
export function isValidEmail(email: string): boolean {
  return SIMPLE_EMAIL_REGEX.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate phone number (US format)
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned[0] === '1');
}

/**
 * Validate date string
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate date range
 */
export function isValidDateRange(startDate: string, endDate: string): boolean {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return false;
  }
  return new Date(startDate) <= new Date(endDate);
}

/**
 * Validate JSON string
 */
export function isValidJson(jsonString: string): boolean {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate enum value
 */
export function isValidEnum<T extends string>(
  value: string,
  enumValues: readonly T[]
): value is T {
  return enumValues.includes(value as T);
}

// ============ Sanitization Functions ============

/**
 * Sanitize input by removing dangerous characters
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return '';
  
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');
  sanitized = sanitized.trim();
  
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Sanitize string input (alias for compatibility)
 */
export function sanitizeString(input: string, maxLength?: number): string {
  if (!input) return '';
  let sanitized = input.trim();
  
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove potential XSS characters
  sanitized = sanitized.replace(/[<>]/g, '');
  
  return sanitized;
}

/**
 * Validate and sanitize integer
 */
export function sanitizeInt(
  value: any,
  min?: number,
  max?: number
): number | null {
  const num = parseInt(String(value), 10);
  
  if (isNaN(num)) return null;
  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;
  
  return num;
}

/**
 * Validate and sanitize float
 */
export function sanitizeFloat(
  value: any,
  min?: number,
  max?: number,
  decimals?: number
): number | null {
  let num = parseFloat(String(value));
  
  if (isNaN(num)) return null;
  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;
  
  if (decimals !== undefined) {
    num = parseFloat(num.toFixed(decimals));
  }
  
  return num;
}

/**
 * Parse JSON safely with default value
 */
export function parseJsonSafely<T = any>(
  jsonString: string,
  defaultValue: T
): T {
  try {
    return JSON.parse(jsonString);
  } catch {
    return defaultValue;
  }
}

// ============ Pagination ============

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  page?: number | string,
  limit?: number | string,
  maxLimit = 100
): PaginationParams {
  const validPage = Math.max(1, sanitizeInt(page, 1) ?? 1);
  const validLimit = Math.min(
    maxLimit,
    Math.max(1, sanitizeInt(limit, 1, maxLimit) ?? 20)
  );
  
  return {
    page: validPage,
    limit: validLimit,
    offset: (validPage - 1) * validLimit,
  };
}

// ============ Field Validation ============

/**
 * Validate required fields exist in object
 */
export function validateRequired<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter(
    (field) => data[field] === undefined || data[field] === null || data[field] === ''
  );
  
  return {
    valid: missing.length === 0,
    missing: missing.map(String),
  };
}

/**
 * Extract and validate bearer token from auth header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '').trim();
  return token || null;
}

/**
 * Check if object has expected shape
 */
export function hasShape<T extends Record<string, any>>(
  obj: any,
  shape: { [K in keyof T]: (value: any) => boolean }
): obj is T {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  return Object.entries(shape).every(([key, validator]) => {
    return validator(obj[key]);
  });
}

/**
 * Validate array of items
 */
export function validateArray<T>(
  items: any[],
  validator: (item: any) => item is T
): { valid: boolean; validItems: T[]; invalidIndices: number[] } {
  const validItems: T[] = [];
  const invalidIndices: number[] = [];
  
  items.forEach((item, index) => {
    if (validator(item)) {
      validItems.push(item);
    } else {
      invalidIndices.push(index);
    }
  });
  
  return {
    valid: invalidIndices.length === 0,
    validItems,
    invalidIndices,
  };
}

// ============ Schema-based Validation ============

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

    if (rules.required && (value === undefined || value === null || value === '')) {
      result.valid = false;
      result.errors[field] = `${field} is required`;
      continue;
    }

    if (!rules.required && (value === undefined || value === null)) {
      continue;
    }

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

    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        result.valid = false;
        result.errors[field] = `${field} must be at least ${rules.minLength} characters`;
        continue;
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        result.valid = false;
        result.errors[field] = `${field} must be at most ${rules.maxLength} characters`;
        continue;
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        result.valid = false;
        result.errors[field] = `${field} format is invalid`;
        continue;
      }

      result.sanitized[field] = sanitizeInput(value, rules.maxLength || 1000);
    } else {
      result.sanitized[field] = value;
    }
  }

  return result;
}

// ============ Zod Schemas ============

/** Phone number validation - accepts various formats, normalizes to E.164 */
export const phoneSchema = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Invalid phone format')
  .transform((val) => {
    const digitsOnly = val.replace(/[^\d]/g, '');
    if (digitsOnly.length === 10) return `+1${digitsOnly}`;
    if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) return `+${digitsOnly}`;
    return val;
  });

/** Email validation with normalization */
export const emailSchema = z.string()
  .email('Invalid email format')
  .max(255, 'Email too long')
  .transform((val) => val.toLowerCase().trim());

/** UUID validation */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/** Optional UUID that allows empty strings */
export const optionalUuidSchema = z.string().uuid().optional().or(z.literal(''));

/** ZIP code validation (US format) */
export const zipCodeSchema = z.string()
  .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format')
  .max(10);

/** US state abbreviation */
export const stateSchema = z.string()
  .max(2, 'State must be 2-letter code')
  .toUpperCase();

// ============ Zod Request Validation ============

/**
 * Validate request body with a Zod schema
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Array<{ field: string; message: string }> } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }
  
  return { success: true, data: result.data };
}

// ============ Phone Normalization ============

/**
 * Normalize phone number to E.164 format
 */
export function normalizePhoneNumber(phone: string): string | null {
  if (!phone) return null;
  
  const digitsOnly = phone.replace(/[^\d]/g, '');
  
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  }
  
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  }
  
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return null;
  }
  
  return `+${digitsOnly}`;
}

// ============ Rate Limiting ============

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Check rate limit using Deno KV
 */
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

// ============ Re-export Zod for convenience ============

export { z };
