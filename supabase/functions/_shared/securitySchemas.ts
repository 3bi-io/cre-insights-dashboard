/**
 * Enhanced Zod validation schemas for edge functions
 * CRITICAL SECURITY: All edge function inputs MUST be validated
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// ============================================================================
// COMMON VALIDATION SCHEMAS
// ============================================================================

export const uuidSchema = z.string().uuid({ message: 'Invalid UUID format' });

export const emailSchema = z
  .string()
  .email({ message: 'Invalid email format' })
  .max(255, { message: 'Email must be less than 255 characters' })
  .toLowerCase()
  .trim();

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format (E.164)' })
  .optional();

export const urlSchema = z
  .string()
  .url({ message: 'Invalid URL format' })
  .max(2048, { message: 'URL must be less than 2048 characters' });

export const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .max(128, { message: 'Password must be less than 128 characters' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' })
  .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' });

export const nameSchema = z
  .string()
  .min(1, { message: 'Name is required' })
  .max(100, { message: 'Name must be less than 100 characters' })
  .regex(/^[a-zA-Z\s'-]+$/, { message: 'Name contains invalid characters' })
  .trim();

export const textSchema = (maxLength: number = 1000) =>
  z
    .string()
    .max(maxLength, { message: `Text must be less than ${maxLength} characters` })
    .trim();

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
  .refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid date' });

export const ipAddressSchema = z
  .string()
  .ip({ message: 'Invalid IP address format' });

// ============================================================================
// PAGINATION SCHEMAS
// ============================================================================

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(200).default(50),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(100).optional(),
});

// ============================================================================
// AUTHENTICATION & AUTHORIZATION SCHEMAS
// ============================================================================

export const authRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const roleSchema = z.enum(['super_admin', 'admin', 'moderator', 'user']);

export const accessReasonSchema = z
  .string()
  .min(10, { message: 'Access reason must be at least 10 characters' })
  .max(500, { message: 'Access reason must be less than 500 characters' })
  .trim();

// ============================================================================
// APPLICATION SCHEMAS
// ============================================================================

export const applicationIdSchema = z.object({
  application_id: uuidSchema,
  access_reason: accessReasonSchema.optional().default('Administrative review'),
});

export const searchApplicationSchema = z.object({
  email: emailSchema.optional(),
  phone: phoneSchema,
  first_name: nameSchema.optional(),
  last_name: nameSchema.optional(),
  driver_id: z.string().max(50).optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
}).refine(
  (data) => data.email || data.phone || data.first_name || data.driver_id,
  { message: 'At least one search criterion is required' }
);

export const createApplicationSchema = z.object({
  job_listing_id: uuidSchema,
  first_name: nameSchema,
  last_name: nameSchema,
  applicant_email: emailSchema,
  phone: phoneSchema,
  city: z.string().max(100).optional(),
  state: z.string().max(2).regex(/^[A-Z]{2}$/).optional(),
  zip: z.string().max(10).regex(/^\d{5}(-\d{4})?$/).optional(),
  cdl: z.enum(['Yes', 'No', 'In Progress']).optional(),
  exp: z.string().max(50).optional(),
  status: z.enum(['pending', 'reviewed', 'interviewing', 'hired', 'rejected']).default('pending'),
});

export const updateApplicationSchema = z.object({
  application_id: uuidSchema,
  status: z.enum(['pending', 'reviewed', 'interviewing', 'hired', 'rejected']).optional(),
  notes: textSchema(1000).optional(),
  recruiter_id: uuidSchema.optional(),
}).refine(
  (data) => data.status || data.notes || data.recruiter_id,
  { message: 'At least one field must be provided for update' }
);

// ============================================================================
// FILE UPLOAD SCHEMAS
// ============================================================================

export const fileUploadSchema = z.object({
  file_name: z.string().min(1).max(255),
  mime_type: z.string().regex(/^[a-z]+\/[a-z0-9\+\-\.]+$/i, { message: 'Invalid MIME type' }),
  file_size: z.number().int().positive().max(10 * 1024 * 1024, { message: 'File must be less than 10MB' }),
  document_type: z.enum(['resume', 'cover_letter', 'license', 'medical_card', 'other']),
  application_id: uuidSchema,
});

// ============================================================================
// RATE LIMITING SCHEMAS
// ============================================================================

export const rateLimitSchema = z.object({
  identifier: z.string().min(1).max(255),
  endpoint: z.string().min(1).max(100),
  max_requests: z.number().int().positive().max(10000).default(100),
  window_minutes: z.number().int().positive().max(1440).default(60),
});

// ============================================================================
// WEBHOOK SCHEMAS
// ============================================================================

export const webhookEventSchema = z.object({
  event_type: z.enum(['application.created', 'application.updated', 'application.deleted']),
  payload: z.record(z.unknown()),
  timestamp: z.string().datetime(),
  signature: z.string().optional(),
});

// ============================================================================
// INTEGRATION SCHEMAS
// ============================================================================

export const tenstreetActionSchema = z.object({
  company_id: z.string().min(1).max(50),
  action: z.enum([
    'explore_services',
    'search_applicants',
    'get_applicant_data',
    'update_applicant_status',
    'create_applicant',
    'get_jobs',
    'export_applicants'
  ]),
  driverId: z.string().max(100).optional(),
  criteria: z.record(z.unknown()).optional(),
  status: z.string().max(100).optional(),
});

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

/**
 * Validate and sanitize request body
 * Returns parsed data or throws ZodError
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  return schema.parse(data);
}

/**
 * Validate and return either data or error
 * Safer version that doesn't throw
 */
export function safeValidateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
}

/**
 * Format Zod errors for user-friendly response
 */
export function formatValidationErrors(error: z.ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(error: z.ZodError): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Validation failed',
      details: formatValidationErrors(error),
    }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
