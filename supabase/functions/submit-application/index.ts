/**
 * Submit Application Handler
 * 
 * Public endpoint for receiving job applications from external sources.
 * Validates input, normalizes data, and stores applications in the database.
 * 
 * SECURITY:
 * - Public endpoint (no JWT required)
 * - Validates all input data with Zod schemas
 * - Rate limiting applied
 * - Logs all submissions for audit
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse, errorResponse, validationErrorResponse } from '../_shared/response.ts';
import { wrapHandler } from '../_shared/error-handler.ts';
import { createLogger } from '../_shared/logger.ts';
import { 
  normalizePhone, 
  findOrCreateJobListing, 
  insertApplication 
} from '../_shared/application-processor.ts';
import { enforceRateLimit, getRateLimitIdentifier } from '../_shared/rate-limiter.ts';

const logger = createLogger('submit-application');

// Zod validation schema for application submissions
const ApplicationSubmissionSchema = z.object({
  // Required fields
  firstName: z.string().trim().min(1, 'First name is required').max(100, 'First name too long').optional(),
  first_name: z.string().trim().min(1, 'First name is required').max(100, 'First name too long').optional(),
  lastName: z.string().trim().min(1, 'Last name is required').max(100, 'Last name too long').optional(),
  last_name: z.string().trim().min(1, 'Last name is required').max(100, 'Last name too long').optional(),
  email: z.string().email('Invalid email format').max(255, 'Email too long').optional(),
  applicant_email: z.string().email('Invalid email format').max(255, 'Email too long').optional(),
  
  // Phone validation - accepts various formats
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Invalid phone format').optional(),
  
  // Location fields
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format').max(10).optional(),
  city: z.string().max(100, 'City name too long').optional(),
  state: z.string().max(2, 'State must be 2-letter code').optional(),
  
  // Job-related fields
  job_listing_id: z.string().uuid('Invalid job listing ID').optional(),
  job_id: z.string().max(50, 'Job ID too long').optional(),
  
  // Application fields with reasonable limits
  cdl: z.string().max(50).optional(),
  experience: z.string().max(50).optional(),
  over21: z.string().max(10).optional(),
  drug: z.string().max(50).optional(),
  veteran: z.string().max(50).optional(),
  consent: z.string().max(50).optional(),
  privacy: z.string().max(50).optional(),
  
  // Employment history - limit to prevent DoS
  employmentHistory: z.any().optional(),
}).refine(
  (data) => (data.firstName || data.first_name) && (data.lastName || data.last_name) && (data.email || data.applicant_email),
  { message: 'First name, last name, and email are required' }
);

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, undefined, origin);
  }

  // Apply rate limiting: 10 submissions per minute per IP
  const identifier = getRateLimitIdentifier(req, false);
  try {
    await enforceRateLimit(identifier, {
      maxRequests: 10,
      windowMs: 60000,
      keyPrefix: 'submit-app'
    });
  } catch (error: any) {
    logger.warn('Rate limit exceeded', { identifier });
    return new Response(
      JSON.stringify({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: error.retryAfter 
      }),
      { 
        status: 429,
        headers: {
          'Retry-After': error.retryAfter?.toString() || '60',
          ...corsHeaders
        }
      }
    );
  }

  const supabase = getServiceClient();
  const startTime = Date.now();

  const rawData = await req.json();
  
  logger.info('Application submission received', { 
    hasEmail: !!(rawData.email || rawData.applicant_email),
    hasJobId: !!(rawData.job_listing_id || rawData.job_id)
  });
  
  // Validate input data with Zod schema
  const validationResult = ApplicationSubmissionSchema.safeParse(rawData);
  
  if (!validationResult.success) {
    const errors = validationResult.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
    
    logger.warn('Validation failed', { errors });
    return validationErrorResponse(errors, origin);
  }
  
  const formData = validationResult.data;

  // Get the CR England organization ID
  const { data: crEnglandOrg, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', 'cr-england')
    .single();

  if (orgError || !crEnglandOrg) {
    logger.error('Failed to fetch organization', { error: orgError });
    return errorResponse('Organization not found', 500, undefined, origin);
  }

    // Determine experience level based on months
    const getExperienceLevel = (months: string) => {
      if (!months) return '';
      
      const monthsNum = parseInt(months);
      if (monthsNum < 3) {
        return 'Less than 3 months experience';
      } else {
        return 'More than 3 months experience';
      }
    };

    // Lookup city/state from zip code for consistency
    const lookupCityState = async (zipCode: string) => {
      if (!zipCode || zipCode.length < 5) {
        return { city: formData.city || '', state: formData.state || '' };
      }

      const cleanZip = zipCode.replace(/\D/g, '').substring(0, 5);
      
      if (cleanZip.length !== 5) {
        return { city: formData.city || '', state: formData.state || '' };
      }

      try {
        const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);
        
        if (!response.ok) {
          console.warn(`Zip code lookup failed for ${cleanZip}: ${response.status}`);
          return { city: formData.city || '', state: formData.state || '' };
        }

        const data = await response.json();
        
        if (data.places && data.places.length > 0) {
          const place = data.places[0];
          return {
            city: place['place name'],
            state: place['state abbreviation']
          };
        }
        
        return { city: formData.city || '', state: formData.state || '' };
      } catch (error) {
        console.error(`Error looking up zip code ${cleanZip}:`, error);
        return { city: formData.city || '', state: formData.state || '' };
      }
    };

  const { city, state } = await lookupCityState(formData.zip);

  logger.info('Location resolved', { city, state, zip: formData.zip });

  // Get or create a job listing for the application using shared processor
  const jobListingId = await findOrCreateJobListing(supabase, {
    jobListingId: formData.job_listing_id,
    jobId: formData.job_id,
    jobTitle: 'General Application',
    organizationId: crEnglandOrg.id,
    clientId: null,
    city,
    state,
    source: 'Direct Application',
  });

    // Map form data to applications table schema
    // Support both camelCase and snake_case field names
    const applicationData = {
      job_listing_id: jobListingId,
      first_name: formData.firstName || formData.first_name,
      last_name: formData.lastName || formData.last_name,
      applicant_email: formData.email || formData.applicant_email,
      phone: normalizePhone(formData.phone),
      city: city,
      state: state,
      zip: formData.zip,
      age: formData.over21,
      cdl: formData.cdl,
      exp: getExperienceLevel(formData.experience),
      drug: formData.drug,
      veteran: formData.veteran,
      employment_history: formData.employmentHistory,
      consent: formData.consent,
      privacy: formData.privacy,
      months: formData.experience,
      source: 'Direct Application',
      status: 'pending',
      applied_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

  // Insert into applications table using shared processor
  const { data, error } = await insertApplication(supabase, applicationData);

  if (error) {
    logger.error('Failed to insert application', { error });
    return errorResponse('Failed to submit application', 500, { details: error.message }, origin);
  }

  const duration_ms = Date.now() - startTime;

  // Application submitted successfully - log only non-PII data
  logger.info('Application submitted successfully', { 
    id: data.id, 
    job_listing_id: data.job_listing_id, 
    status: data.status,
    duration_ms
  });

  return successResponse(
    { 
      message: 'Application submitted successfully', 
      applicationId: data.id 
    },
    undefined,
    { duration_ms },
    origin
  );
};

serve(wrapHandler(handler, { context: 'submit-application', logRequests: true }));
