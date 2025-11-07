/**
 * Validation Helper Utilities
 * Common validation patterns and helpers beyond Zod schemas
 */

/**
 * Validate UUID format
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
 * Sanitize string input
 */
export function sanitizeString(input: string, maxLength?: number): string {
  let sanitized = input.trim();
  
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
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
 * Validate enum value
 */
export function isValidEnum<T extends string>(
  value: string,
  enumValues: readonly T[]
): value is T {
  return enumValues.includes(value as T);
}

/**
 * Validate pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

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

/**
 * Validate required fields
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
 * Extract and validate bearer token
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '').trim();
  return token || null;
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
 * Parse JSON safely
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

/**
 * Validate object shape
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
