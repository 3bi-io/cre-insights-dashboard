/**
 * Centralized Zod Validation Schemas for Edge Functions
 * Provides reusable validation schemas for common data types
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// ============ Common Field Schemas ============

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

// ============ SMS Schemas ============

export const smsRequestSchema = z.object({
  to: phoneSchema,
  message: z.string()
    .min(1, 'Message is required')
    .max(1600, 'Message too long (max 1600 characters)'),
  conversationId: uuidSchema,
  messageId: uuidSchema,
});

export type SMSRequest = z.infer<typeof smsRequestSchema>;

// ============ Application Schemas ============

export const applicationSubmissionSchema = z.object({
  // Required fields - support both camelCase and snake_case
  firstName: z.string().trim().min(1).max(100).optional(),
  first_name: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  last_name: z.string().trim().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
  applicant_email: z.string().email().max(255).optional(),
  
  // Phone validation
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/).optional(),
  
  // Location fields
  zip: z.string().regex(/^\d{5}(-\d{4})?$/).max(10).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  
  // Job-related fields
  job_listing_id: optionalUuidSchema,
  job_id: z.string().max(50).optional(),
  org_slug: z.string().max(100).optional(),
  
  // Application fields
  cdl: z.string().max(50).optional(),
  experience: z.string().max(50).optional(),
  months: z.string().max(10).optional(),
  exp: z.string().max(100).optional(),
  over21: z.string().max(10).optional(),
  drug: z.string().max(50).optional(),
  veteran: z.string().max(50).optional(),
  consent: z.string().max(50).optional(),
  privacy: z.string().max(50).optional(),
  
  // URL tracking parameters
  ad_id: z.string().max(100).optional(),
  campaign_id: z.string().max(100).optional(),
  adset_id: z.string().max(100).optional(),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
  referral_source: z.string().max(500).optional(),
  
  // Employment history
  employmentHistory: z.any().optional(),
}).refine(
  (data) => (data.firstName || data.first_name) && (data.lastName || data.last_name) && (data.email || data.applicant_email),
  { message: 'First name, last name, and email are required' }
);

export type ApplicationSubmission = z.infer<typeof applicationSubmissionSchema>;

// ============ Inbound Application Schema ============

export const inboundApplicationSchema = z.object({
  // Applicant Information
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  full_name: z.string().max(200).optional(),
  applicant_email: z.string().email().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  
  // Location
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip: z.string().max(20).optional(),
  address_1: z.string().max(255).optional(),
  address_2: z.string().max(255).optional(),
  country: z.string().max(50).default('US'),
  
  // Job Details
  job_listing_id: z.string().optional(),
  job_id: z.string().optional(),
  job_title: z.string().max(255).optional(),
  
  // CDL & Experience
  cdl: z.string().max(50).optional(),
  cdl_class: z.string().max(10).optional(),
  cdl_state: z.string().max(50).optional(),
  cdl_endorsements: z.array(z.string()).optional(),
  exp: z.string().max(100).optional(),
  experience_years: z.string().max(20).optional(),
  
  // Demographics
  age: z.string().max(20).optional(),
  veteran: z.string().max(50).optional(),
  education_level: z.string().max(100).optional(),
  work_authorization: z.string().max(100).optional(),
  
  // Screening
  consent: z.string().max(50).optional(),
  drug: z.string().max(50).optional(),
  privacy: z.string().max(50).optional(),
  convicted_felony: z.string().max(50).optional(),
  
  // Source tracking
  source: z.string().max(100).optional(),
  ad_id: z.string().max(100).optional(),
  campaign_id: z.string().max(100).optional(),
  adset_id: z.string().max(100).optional(),
  
  // Organization
  organization_id: z.string().optional(),
  organization_slug: z.string().max(100).optional(),
  
  // Client routing
  client_name: z.string().max(255).optional(),
  client_slug: z.string().max(100).optional(),
  client_company: z.string().max(255).optional(),
  
  // Additional fields
  notes: z.string().max(5000).optional(),
  status: z.string().max(50).default('pending'),
}).passthrough(); // Allow additional fields

export type InboundApplication = z.infer<typeof inboundApplicationSchema>;

// ============ Outbound Call Schemas ============

export const outboundCallRequestSchema = z.object({
  application_id: uuidSchema.optional(),
  outbound_call_id: uuidSchema.optional(),
  voice_agent_id: uuidSchema.optional(),
  phone_number: z.string().optional(),
  process_queue: z.boolean().optional(),
  sync_initiated: z.boolean().optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

export type OutboundCallRequest = z.infer<typeof outboundCallRequestSchema>;

// ============ Tenstreet Schemas ============

export const tenstreetActionSchema = z.enum(['send_application', 'test_connection', 'sync_applicant']);

export const tenstreetConfigSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  password: z.string().min(1, 'Password is required'),
  mode: z.enum(['PROD', 'TEST']),
  service: z.string().optional(),
  source: z.string().optional(),
  companyId: z.string().optional(),
  companyName: z.string().optional(),
  appReferrer: z.string().optional(),
  jobId: z.string().optional(),
  statusTag: z.string().optional(),
  driverId: z.string().optional(),
});

export const tenstreetRequestSchema = z.object({
  action: tenstreetActionSchema,
  config: tenstreetConfigSchema.optional(),
  applicationData: z.record(z.any()).optional(),
  mappings: z.record(z.any()).optional(),
  phone: z.string().optional(),
});

export type TenstreetRequest = z.infer<typeof tenstreetRequestSchema>;

// ============ Validation Helper Functions ============

/**
 * Validate request body with a Zod schema
 * Returns parsed data or throws a validation error
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
  
  // Return null for invalid phone numbers
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return null;
  }
  
  return `+${digitsOnly}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize string for safe output (prevent XSS in logs/responses)
 */
export function sanitizeString(str: string, maxLength: number = 1000): string {
  if (!str) return '';
  return str.slice(0, maxLength).replace(/[<>]/g, '');
}
