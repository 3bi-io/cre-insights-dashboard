/**
 * @deprecated This file is deprecated. Import from validation.ts instead.
 * 
 * This file re-exports from validation.ts for backwards compatibility.
 * All edge functions should migrate to importing from validation.ts directly.
 */

export {
  // Basic validators
  isValidUuid,
  isValidEmail,
  isValidUrl,
  isValidPhone,
  isValidDate,
  isValidDateRange,
  isValidJson,
  isValidEnum,
  
  // Sanitization
  sanitizeString,
  sanitizeInt,
  sanitizeFloat,
  parseJsonSafely,
  
  // Field validation
  validateRequired,
  validatePagination,
  validateArray,
  extractBearerToken,
  hasShape,
  
  // Types
  type PaginationParams,
} from './validation.ts';
