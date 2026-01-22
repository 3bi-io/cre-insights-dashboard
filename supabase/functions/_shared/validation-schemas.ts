/**
 * @deprecated This file is deprecated. Import from validation.ts instead.
 * 
 * This file re-exports from validation.ts for backwards compatibility.
 * All edge functions should migrate to importing from validation.ts directly.
 */

export {
  // Zod schemas
  phoneSchema,
  emailSchema,
  uuidSchema,
  optionalUuidSchema,
  zipCodeSchema,
  stateSchema,
  
  // Validation helpers
  validateRequest,
  normalizePhoneNumber,
  isValidEmail,
  sanitizeString,
  
  // Zod re-export
  z,
} from './validation.ts';

// Re-export application schemas that are still in validation-schemas
// These complex schemas should be imported from the unified module
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// ============ SMS Schemas ============

export const smsRequestSchema = z.object({
  to: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Invalid phone format'),
  message: z.string()
    .min(1, 'Message is required')
    .max(1600, 'Message too long (max 1600 characters)'),
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
});

export type SMSRequest = z.infer<typeof smsRequestSchema>;

// ============ Application Schemas ============

export const applicationSubmissionSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  first_name: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  last_name: z.string().trim().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
  applicant_email: z.string().email().max(255).optional(),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/).optional(),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/).max(10).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  job_listing_id: z.string().uuid().optional().or(z.literal('')),
  job_id: z.string().max(50).optional(),
  org_slug: z.string().max(100).optional(),
  cdl: z.string().max(50).optional(),
  experience: z.string().max(50).optional(),
  months: z.string().max(10).optional(),
  exp: z.string().max(100).optional(),
  over21: z.string().max(10).optional(),
  drug: z.string().max(50).optional(),
  veteran: z.string().max(50).optional(),
  consent: z.string().max(50).optional(),
  privacy: z.string().max(50).optional(),
  ad_id: z.string().max(100).optional(),
  campaign_id: z.string().max(100).optional(),
  adset_id: z.string().max(100).optional(),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
  referral_source: z.string().max(500).optional(),
  employmentHistory: z.any().optional(),
}).refine(
  (data) => (data.firstName || data.first_name) && (data.lastName || data.last_name) && (data.email || data.applicant_email),
  { message: 'First name, last name, and email are required' }
);

export type ApplicationSubmission = z.infer<typeof applicationSubmissionSchema>;

// ============ Inbound Application Schema ============

export const inboundApplicationSchema = z.object({
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  full_name: z.string().max(200).optional(),
  applicant_email: z.string().email().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip: z.string().max(20).optional(),
  address_1: z.string().max(255).optional(),
  address_2: z.string().max(255).optional(),
  country: z.string().max(50).default('US'),
  job_listing_id: z.string().optional(),
  job_id: z.string().optional(),
  job_title: z.string().max(255).optional(),
  cdl: z.string().max(50).optional(),
  cdl_class: z.string().max(10).optional(),
  cdl_state: z.string().max(50).optional(),
  cdl_endorsements: z.array(z.string()).optional(),
  exp: z.string().max(100).optional(),
  experience_years: z.string().max(20).optional(),
  age: z.string().max(20).optional(),
  veteran: z.string().max(50).optional(),
  education_level: z.string().max(100).optional(),
  work_authorization: z.string().max(100).optional(),
  consent: z.string().max(50).optional(),
  drug: z.string().max(50).optional(),
  privacy: z.string().max(50).optional(),
  convicted_felony: z.string().max(50).optional(),
  source: z.string().max(100).optional(),
  ad_id: z.string().max(100).optional(),
  campaign_id: z.string().max(100).optional(),
  adset_id: z.string().max(100).optional(),
  organization_id: z.string().optional(),
  organization_slug: z.string().max(100).optional(),
  client_name: z.string().max(255).optional(),
  client_slug: z.string().max(100).optional(),
  client_company: z.string().max(255).optional(),
  notes: z.string().max(5000).optional(),
  status: z.string().max(50).default('pending'),
}).passthrough();

export type InboundApplication = z.infer<typeof inboundApplicationSchema>;

// ============ Outbound Call Schemas ============

export const outboundCallRequestSchema = z.object({
  application_id: z.string().uuid().optional(),
  outbound_call_id: z.string().uuid().optional(),
  voice_agent_id: z.string().uuid().optional(),
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
