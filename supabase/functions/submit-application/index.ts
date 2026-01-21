import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { 
  normalizePhone, 
  findOrCreateJobListing, 
  insertApplication 
} from "../_shared/application-processor.ts";
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse, errorResponse, validationErrorResponse } from '../_shared/response.ts';
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimitWithGeo } from '../_shared/rate-limiter.ts';
import { autoPostToATS } from '../_shared/ats-adapters/auto-post-engine.ts';
import { extractIPFromRequest, getGeoLocation } from '../_shared/geo-lookup.ts';
import { checkGeoAccess } from '../_shared/geo-blocking.ts';

const logger = createLogger('submit-application');

// ============================================================
// KNOWN INTEGRATION PARTNERS - Mirrored from inbound-applications
// Maps domain signatures to official source names
// ============================================================
const INTEGRATION_SIGNATURES: Record<string, { source: string; requiresScreening: boolean }> = {
  'cdljobcast.com': { source: 'CDL Job Cast', requiresScreening: false },
  'cdljobcast': { source: 'CDL Job Cast', requiresScreening: false },
  'zapier.com': { source: 'Zapier Integration', requiresScreening: false },
  'hooks.zapier.com': { source: 'Zapier Integration', requiresScreening: false },
  'indeed.com': { source: 'Indeed', requiresScreening: false },
  'make.com': { source: 'Make Integration', requiresScreening: false },
  'integromat.com': { source: 'Make Integration', requiresScreening: false },
};

// Source-specific organization enforcement
// These sources MUST route to specific organizations regardless of other identifiers
const SOURCE_ORGANIZATION_OVERRIDES: Record<string, string> = {
  'CDL Job Cast': '84214b48-7b51-45bc-ad7f-723bcf50466c', // Hayes Recruiting Solutions
};

/**
 * Detect integration source from request headers
 */
const detectIntegrationSource = (req: Request): string => {
  const origin = req.headers.get('origin') || '';
  const referer = req.headers.get('referer') || '';
  const userAgent = req.headers.get('user-agent') || '';
  const combined = `${origin} ${referer} ${userAgent}`.toLowerCase();
  
  for (const [domain, config] of Object.entries(INTEGRATION_SIGNATURES)) {
    if (combined.includes(domain.toLowerCase())) {
      logger.info('Detected integration source from headers', { source: config.source, matchedDomain: domain });
      return config.source;
    }
  }
  
  return 'Direct Application';
};

// Zod validation schema for application submissions
// Extended to support both quick apply and detailed application forms
const ApplicationSubmissionSchema = z.object({
  // Required fields (support both camelCase and snake_case)
  firstName: z.string().trim().min(1, 'First name is required').max(100, 'First name too long').optional(),
  first_name: z.string().trim().min(1, 'First name is required').max(100, 'First name too long').optional(),
  lastName: z.string().trim().min(1, 'Last name is required').max(100, 'Last name too long').optional(),
  last_name: z.string().trim().min(1, 'Last name is required').max(100, 'Last name too long').optional(),
  email: z.string().email('Invalid email format').max(255, 'Email too long').optional(),
  applicant_email: z.string().email('Invalid email format').max(255, 'Email too long').optional(),
  
  // Phone validation - accepts various formats
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Invalid phone format').optional(),
  secondary_phone: z.string().optional().nullable(),
  preferred_contact_method: z.string().max(50).optional(),
  
  // Location fields
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format').max(10).optional(),
  city: z.string().max(100, 'City name too long').optional(),
  state: z.string().max(50, 'State name too long').optional(),
  address_1: z.string().max(255).optional(),
  address_2: z.string().max(255).optional(),
  country: z.string().max(50).default('US').optional(),
  
  // Job-related fields
  job_listing_id: z.string().uuid('Invalid job listing ID').optional().or(z.literal('')),
  job_id: z.string().max(50, 'Job ID too long').optional(),
  org_slug: z.string().max(100, 'Organization slug too long').optional(),
  
  // Personal extended fields (detailed form)
  prefix: z.string().max(20).optional(),
  middle_name: z.string().max(100).optional(),
  suffix: z.string().max(20).optional(),
  date_of_birth: z.string().optional(), // YYYY-MM-DD format
  ssn: z.string().max(20).optional(),
  government_id: z.string().max(100).optional(),
  government_id_type: z.string().max(50).optional(),
  
  // Emergency contact
  emergency_contact_name: z.string().max(200).optional(),
  emergency_contact_phone: z.string().optional().nullable(),
  emergency_contact_relationship: z.string().max(100).optional(),
  
  // CDL & License fields
  cdl: z.string().max(50).optional(),
  cdl_class: z.string().max(10).optional(),
  cdl_endorsements: z.array(z.string()).optional(),
  cdl_expiration_date: z.string().optional(),
  cdl_state: z.string().max(50).optional(),
  driving_experience_years: z.number().int().min(0).max(99).optional(),
  
  // Experience fields
  experience: z.string().max(50).optional(),
  months: z.string().max(10).optional(),
  exp: z.string().max(100).optional(),
  accident_history: z.string().max(2000).optional(),
  violation_history: z.string().max(2000).optional(),
  education_level: z.string().max(100).optional(),
  
  // Military service
  military_service: z.string().max(50).optional(),
  military_branch: z.string().max(100).optional(),
  military_start_date: z.string().optional(),
  military_end_date: z.string().optional(),
  veteran: z.string().max(50).optional(),
  
  // Background & Legal
  convicted_felony: z.string().max(50).optional(),
  felony_details: z.string().max(2000).optional(),
  work_authorization: z.string().max(100).optional(),
  
  // Work preferences
  can_work_weekends: z.string().max(50).optional(),
  can_work_nights: z.string().max(50).optional(),
  willing_to_relocate: z.string().max(50).optional(),
  preferred_start_date: z.string().optional(),
  salary_expectations: z.string().max(100).optional(),
  
  // Medical & Certifications
  medical_card_expiration: z.string().optional(),
  hazmat_endorsement: z.string().max(50).optional(),
  passport_card: z.string().max(50).optional(),
  twic_card: z.string().max(50).optional(),
  dot_physical_date: z.string().optional(),
  
  // Application details
  how_did_you_hear: z.string().max(255).optional(),
  
  // Screening & Consents
  over21: z.string().max(10).optional(),
  can_pass_drug_test: z.string().max(50).optional(),
  can_pass_physical: z.string().max(50).optional(),
  drug: z.string().max(50).optional(),
  consent: z.string().max(50).optional(),
  privacy: z.string().max(50).optional(),
  agree_privacy_policy: z.string().max(50).optional(),
  consent_to_sms: z.string().max(50).optional(),
  consent_to_email: z.string().max(50).optional(),
  background_check_consent: z.string().max(50).optional(),
  
  // URL tracking parameters
  ad_id: z.string().max(100).optional(),
  campaign_id: z.string().max(100).optional(),
  adset_id: z.string().max(100).optional(),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
  referral_source: z.string().max(500).optional(),
  
  // Employment history - limit to prevent DoS
  employmentHistory: z.any().optional(),
  employment_history: z.any().optional(),
}).refine(
  (data) => (data.firstName || data.first_name) && (data.lastName || data.last_name) && (data.email || data.applicant_email),
  { message: 'First name, last name, and email are required' }
);

// Build comprehensive payload for Zapier/webhooks
function buildZapierPayload(app: Record<string, unknown>) {
  return {
    // Event metadata
    event_type: 'created',
    timestamp: new Date().toISOString(),
    
    // Application ID
    id: app.id,
    job_listing_id: app.job_listing_id,
    job_id: app.job_id,
    
    // Personal information
    first_name: app.first_name,
    last_name: app.last_name,
    full_name: app.full_name,
    email: app.applicant_email,
    phone: app.phone,
    
    // Location
    city: app.city,
    state: app.state,
    zip: app.zip,
    country: app.country || 'US',
    
    // Screening fields
    age_verification: app.age,
    cdl_status: app.cdl,
    experience_text: app.exp,
    experience_months: app.months,
    drug_screen: app.drug,
    veteran_status: app.veteran,
    
    // Consent
    sms_consent: app.consent,
    privacy_accepted: app.privacy,
    
    // Marketing attribution
    ad_id: app.ad_id,
    campaign_id: app.campaign_id,
    adset_id: app.adset_id,
    referral_source: app.referral_source,
    how_did_you_hear: app.how_did_you_hear,
    
    // Metadata
    source: app.source,
    status: app.status,
    applied_at: app.applied_at,
    created_at: app.created_at,
  };
}

// Trigger webhooks for applications matching the source filter
async function triggerSourceWebhooks(
  supabase: ReturnType<typeof createClient>, 
  applicationId: string, 
  source: string
): Promise<void> {
  // Find all enabled webhooks that match this source
  const { data: webhooks, error: webhookError } = await supabase
    .from('client_webhooks')
    .select('id, webhook_url, event_types, source_filter')
    .eq('enabled', true);

  if (webhookError) {
    logger.error('Error fetching webhooks', webhookError);
    return;
  }

  // Filter webhooks that have this source in their source_filter
  const matchingWebhooks = (webhooks || []).filter((webhook: Record<string, unknown>) => {
    const sourceFilter = webhook.source_filter as string[] | null;
    if (!sourceFilter || sourceFilter.length === 0) return false;
    return sourceFilter.includes(source);
  });

  if (matchingWebhooks.length === 0) {
    logger.info('No webhooks configured for source', { source });
    return;
  }

  // Get complete application data
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (appError || !application) {
    logger.error('Error fetching application for webhook', appError);
    return;
  }

  // Send to each matching webhook
  for (const webhook of matchingWebhooks) {
    const eventTypes = webhook.event_types as string[] | null;
    // Check if 'created' event type is enabled (or if no event_types specified, default to all)
    if (eventTypes && eventTypes.length > 0 && !eventTypes.includes('created')) {
      logger.debug('Webhook skipped: created not in event_types', { webhook_id: webhook.id });
      continue;
    }

    const payload = buildZapierPayload(application);
    const startTime = Date.now();
    
    try {
      const response = await fetch(webhook.webhook_url as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const durationMs = Date.now() - startTime;
      const responseText = await response.text().catch(() => '');
      
      logger.info('Webhook sent', { 
        webhook_id: webhook.id, 
        status: response.status, 
        duration_ms: durationMs 
      });
      
      // Log the webhook call
      await supabase.from('client_webhook_logs').insert({
        webhook_id: webhook.id,
        application_id: applicationId,
        event_type: 'created',
        request_payload: payload,
        response_status: response.status,
        response_body: responseText.substring(0, 1000),
        duration_ms: durationMs,
      });
      
      // Update last triggered timestamp
      const updateData: Record<string, unknown> = {
        last_triggered_at: new Date().toISOString(),
      };
      if (response.ok) {
        updateData.last_success_at = new Date().toISOString();
        updateData.last_error = null;
      } else {
        updateData.last_error = `HTTP ${response.status}: ${responseText.substring(0, 200)}`;
      }
      
      await supabase.from('client_webhooks')
        .update(updateData)
        .eq('id', webhook.id);
      
    } catch (err) {
      const error = err as Error;
      const durationMs = Date.now() - startTime;
      logger.error('Webhook failed', error, { webhook_id: webhook.id });
      
      // Log the failed attempt
      await supabase.from('client_webhook_logs').insert({
        webhook_id: webhook.id,
        application_id: applicationId,
        event_type: 'created',
        request_payload: payload,
        error_message: error.message || 'Unknown error',
        duration_ms: durationMs,
      });
      
      // Update error status
      await supabase.from('client_webhooks')
        .update({
          last_triggered_at: new Date().toISOString(),
          last_error: error.message || 'Unknown error',
        })
        .eq('id', webhook.id);
    }
  }
}

/**
 * Resolve organization ID and job details from various sources
 * Priority: source_override -> job_listing_id -> org_slug -> fallback to CR England
 */
async function resolveOrganizationAndJob(
  supabase: ReturnType<typeof createClient>,
  jobListingId?: string,
  orgSlug?: string,
  detectedSource?: string
): Promise<{ organizationId: string; organizationName: string; externalJobId: string | null; jobTitle: string | null }> {
  // Priority 0: Source-based organization override (e.g., CDL Job Cast → Hayes)
  if (detectedSource && SOURCE_ORGANIZATION_OVERRIDES[detectedSource]) {
    const overrideOrgId = SOURCE_ORGANIZATION_OVERRIDES[detectedSource];
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', overrideOrgId)
      .single();
    
    if (org) {
      logger.info('Resolved org from source override', { source: detectedSource, org_name: org.name });
      return { organizationId: org.id, organizationName: org.name, externalJobId: null, jobTitle: null };
    }
  }

  // Priority 1: Get org from job_listing_id
  if (jobListingId) {
    const { data: jobListing } = await supabase
      .from('job_listings')
      .select('organization_id, external_job_id, title, organizations(id, name, slug)')
      .eq('id', jobListingId)
      .single();
    
    if (jobListing?.organization_id) {
      const org = jobListing.organizations as { id: string; name: string; slug: string } | null;
      logger.info('Resolved org from job_listing_id', { org_name: org?.name, external_job_id: jobListing.external_job_id });
      return {
        organizationId: jobListing.organization_id,
        organizationName: org?.name || 'Unknown',
        externalJobId: jobListing.external_job_id || null,
        jobTitle: jobListing.title || null
      };
    }
  }
  
  // Priority 2: Get org from org_slug
  if (orgSlug) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('slug', orgSlug)
      .single();
    
    if (org) {
      logger.info('Resolved org from slug', { org_name: org.name });
      return { organizationId: org.id, organizationName: org.name, externalJobId: null, jobTitle: null };
    }
  }
  
  // Fallback: CR England
  const { data: crEnglandOrg } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', 'cr-england')
    .single();

  logger.info('Falling back to CR England org');
  return {
    organizationId: crEnglandOrg?.id || '',
    organizationName: crEnglandOrg?.name || 'C.R. England',
    externalJobId: null,
    jobTitle: null
  };
}

/**
 * Check for duplicate applications within the last 30 days
 */
async function checkDuplicateApplication(
  supabase: ReturnType<typeof createClient>,
  email: string,
  jobListingId: string | null
): Promise<{ isDuplicate: boolean; existingApplicationDate?: string }> {
  if (!email) return { isDuplicate: false };
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  let query = supabase
    .from('applications')
    .select('id, applied_at')
    .eq('applicant_email', email.toLowerCase())
    .gte('applied_at', thirtyDaysAgo.toISOString())
    .limit(1);
  
  // If we have a job listing ID, check for exact match
  if (jobListingId) {
    query = query.eq('job_listing_id', jobListingId);
  }
  
  const { data: existingApp } = await query.maybeSingle();
  
  if (existingApp) {
    logger.info('Duplicate application detected', { email_hash: email.substring(0, 3) + '***' });
    return { 
      isDuplicate: true, 
      existingApplicationDate: existingApp.applied_at 
    };
  }
  
  return { isDuplicate: false };
}

/**
 * Send application confirmation email (non-blocking)
 */
async function sendConfirmationEmail(
  applicantEmail: string,
  firstName: string,
  lastName: string,
  jobTitle: string | null,
  organizationName: string
): Promise<void> {
  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-application-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({
        to: applicantEmail,
        subject: `Application Received${jobTitle ? ` - ${jobTitle}` : ''}`,
        candidateName: `${firstName} ${lastName}`.trim(),
        jobTitle: jobTitle || 'Driver Position',
        companyName: organizationName,
        type: 'application_received'
      })
    });
    
    if (response.ok) {
      logger.info('Confirmation email sent', { email_hash: applicantEmail.substring(0, 3) + '***' });
    } else {
      const errorText = await response.text();
      logger.warn('Failed to send confirmation email', { status: response.status, error: errorText });
    }
  } catch (err) {
    logger.error('Error sending confirmation email', err as Error);
  }
}

// Legacy auto-post functions removed - now using generic autoPostToATS from ats-adapters

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Geo-blocking check - server-side enforcement for PII protection
    const clientIP = extractIPFromRequest(req);
    const geo = await getGeoLocation(clientIP);
    const geoResult = checkGeoAccess(geo);
    
    if (!geoResult.allowed) {
      logger.warn('Blocked application submission from restricted region', {
        ip: clientIP.substring(0, 10) + '***',
        countryCode: geoResult.countryCode,
        country: geoResult.country,
        reason: geoResult.reason,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: geoResult.message || 'Access is not available in your region.',
          blocked: true,
          reason: 'geographic_restriction',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Rate limiting based on IP with geo-awareness for developer regions
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const rateLimitResult = await checkRateLimitWithGeo(req, `submit-app:${ip}`, {
      maxRequests: 20,
      windowMs: 60000, // 20 requests per minute per IP (100/min for DFW/Alabama devs)
    });
    
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded', { 
        ip, 
        retry_after: rateLimitResult.retryAfter,
        geo_applied: rateLimitResult.geoApplied,
        effective_limit: rateLimitResult.effectiveMaxRequests
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.retryAfter || 60)
          }
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405, undefined, origin || undefined);
    }

    const rawData = await req.json();
    
    // Validate input data with Zod schema
    const validationResult = ApplicationSubmissionSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(i => ({
        field: i.path.join('.'),
        message: i.message
      }));
      logger.warn('Validation failed', { errors });
      return validationErrorResponse(errors, origin || undefined);
    }
    
    const formData = validationResult.data;
    
    const applicantEmail = (formData.email || formData.applicant_email || '').toLowerCase();

    // Detect integration source from request headers (CDL Job Cast, Zapier, etc.)
    const detectedSource = detectIntegrationSource(req);
    logger.info('Integration source detection', { detectedSource });

    // Resolve organization and job details dynamically (source-based routing takes priority)
    const { organizationId, organizationName, externalJobId, jobTitle } = await resolveOrganizationAndJob(
      supabase,
      formData.job_listing_id,
      formData.org_slug,
      detectedSource
    );

    // Check for duplicate applications within 30 days
    const { isDuplicate, existingApplicationDate } = await checkDuplicateApplication(
      supabase,
      applicantEmail,
      formData.job_listing_id || null
    );

    if (isDuplicate) {
      const appliedDate = existingApplicationDate 
        ? new Date(existingApplicationDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : 'recently';
      
      logger.info('Duplicate application rejected', { email_hash: applicantEmail.substring(0, 3) + '***' });
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `You already applied to this position on ${appliedDate}. Check your email for updates on your application status.`
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Determine experience level based on months
    const getExperienceLevel = (months: string) => {
      if (!months) return '';
      const monthsNum = parseInt(months);
      return monthsNum < 3 ? 'Less than 3 months experience' : 'More than 3 months experience';
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
      } catch {
        return { city: formData.city || '', state: formData.state || '' };
      }
    };

    const { city, state } = await lookupCityState(formData.zip || '');

    // Get or create a job listing for the application using shared processor
    const jobListingResult = await findOrCreateJobListing(supabase, {
      jobListingId: formData.job_listing_id,
      jobId: formData.job_id,
      jobTitle: 'General Application',
      organizationId: organizationId,
      clientId: null,
      city,
      state,
      source: 'Direct Application',
    });

    if (!jobListingResult) {
      logger.error('Failed to resolve job listing');
      return errorResponse('Unable to process application - no job found', 400, undefined, origin || undefined);
    }

    logger.info('Job listing resolved', { 
      jobListingId: jobListingResult.id, 
      matchType: jobListingResult.matchType 
    });

    // Map form data to applications table schema
    const firstName = formData.firstName || formData.first_name || '';
    const lastName = formData.lastName || formData.last_name || '';
    
    // Calculate driving experience years from months
    const monthsValue = formData.months || formData.experience || '0';
    const monthsNum = parseInt(monthsValue) || 0;
    const drivingExperienceYears = formData.driving_experience_years ?? Math.floor(monthsNum / 12);
    
    const applicationData = {
      job_listing_id: jobListingResult.id,
      job_id: externalJobId || formData.job_id || null,
      
      // Personal info
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`.trim() || null,
      applicant_email: applicantEmail,
      phone: normalizePhone(formData.phone || ''),
      
      // Extended personal fields (detailed form)
      prefix: formData.prefix || null,
      middle_name: formData.middle_name || null,
      suffix: formData.suffix || null,
      date_of_birth: formData.date_of_birth || null,
      ssn: formData.ssn || null,
      government_id: formData.government_id || null,
      government_id_type: formData.government_id_type || null,
      
      // Contact
      secondary_phone: normalizePhone(formData.secondary_phone || '') || null,
      preferred_contact_method: formData.preferred_contact_method || null,
      
      // Emergency contact
      emergency_contact_name: formData.emergency_contact_name || null,
      emergency_contact_phone: normalizePhone(formData.emergency_contact_phone || '') || null,
      emergency_contact_relationship: formData.emergency_contact_relationship || null,
      
      // Location
      city: city,
      state: state,
      zip: formData.zip,
      address_1: formData.address_1 || null,
      address_2: formData.address_2 || null,
      country: formData.country || 'US',
      
      // CDL & License
      cdl: formData.cdl,
      cdl_class: formData.cdl_class || null,
      cdl_endorsements: formData.cdl_endorsements || null,
      cdl_expiration_date: formData.cdl_expiration_date || null,
      cdl_state: formData.cdl_state || null,
      
      // Experience
      age: formData.over21,
      exp: formData.exp || getExperienceLevel(formData.experience || ''),
      driving_experience_years: drivingExperienceYears,
      accident_history: formData.accident_history || null,
      violation_history: formData.violation_history || null,
      education_level: formData.education_level || null,
      
      // Military
      military_service: formData.military_service || null,
      military_branch: formData.military_branch || null,
      military_start_date: formData.military_start_date || null,
      military_end_date: formData.military_end_date || null,
      veteran: formData.veteran,
      
      // Background & Legal
      convicted_felony: formData.convicted_felony || null,
      felony_details: formData.felony_details || null,
      work_authorization: formData.work_authorization || null,
      
      // Work preferences
      can_work_weekends: formData.can_work_weekends || null,
      can_work_nights: formData.can_work_nights || null,
      willing_to_relocate: formData.willing_to_relocate || null,
      preferred_start_date: formData.preferred_start_date || null,
      salary_expectations: formData.salary_expectations || null,
      
      // Medical & Certifications
      medical_card_expiration: formData.medical_card_expiration || null,
      hazmat_endorsement: formData.hazmat_endorsement || null,
      passport_card: formData.passport_card || null,
      twic_card: formData.twic_card || null,
      dot_physical_date: formData.dot_physical_date || null,
      
      // Screening & Consents
      over_21: formData.over21 || null,
      can_pass_drug_test: formData.can_pass_drug_test || null,
      can_pass_physical: formData.can_pass_physical || null,
      drug: formData.drug,
      consent: formData.consent,
      privacy: formData.privacy,
      agree_privacy_policy: formData.agree_privacy_policy || null,
      consent_to_sms: formData.consent_to_sms || null,
      consent_to_email: formData.consent_to_email || null,
      background_check_consent: formData.background_check_consent || null,
      
      // Employment history (supports both key formats)
      employment_history: formData.employmentHistory || formData.employment_history || null,
      months: monthsValue,
      
      // URL tracking parameters
      ad_id: formData.ad_id || null,
      campaign_id: formData.campaign_id || null,
      adset_id: formData.adset_id || null,
      referral_source: formData.referral_source || formData.utm_source || null,
      how_did_you_hear: formData.how_did_you_hear || formData.utm_medium || formData.utm_campaign || null,
      
      // Metadata
      source: detectedSource,
      status: 'pending',
      applied_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert into applications table using shared processor
    const { data, error } = await insertApplication(supabase, applicationData);

    if (error) {
      logger.error('Error inserting application', error);
      return errorResponse('Failed to submit application', 500, { details: error.message }, origin || undefined);
    }

    // Log success (only non-PII data)
    logger.info('Application submitted successfully', { 
      id: data.id, 
      job_listing_id: data.job_listing_id, 
      organization: organizationName,
      status: data.status 
    });

    // Trigger webhooks for the detected source (non-blocking)
    try {
      await triggerSourceWebhooks(supabase, data.id, detectedSource);
    } catch (webhookError) {
      logger.error('Webhook trigger failed (non-blocking)', webhookError as Error);
    }

    // Send confirmation email to applicant (non-blocking background task)
    EdgeRuntime.waitUntil(
      sendConfirmationEmail(applicantEmail, firstName, lastName, jobTitle, organizationName)
    );

    // Auto-post to ALL configured ATS systems (Tenstreet, DriverReach, etc.)
    // Uses generic ATS adapter pattern - non-blocking background task
    EdgeRuntime.waitUntil(
      autoPostToATS(supabase, data.id, organizationId, applicationData as Record<string, unknown>)
        .then((result) => {
          logger.info('ATS auto-post completed', { 
            application_id: data.id,
            total: result.totalConnections,
            successful: result.successful,
            failed: result.failed,
            skipped: result.skipped
          });
        })
        .catch((err) => {
          logger.error('ATS auto-post failed', err as Error, { application_id: data.id });
        })
    );

    // Check if organization has voice agent for response
    const { data: voiceAgent } = await supabase
      .from('voice_agents')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .eq('is_outbound_enabled', true)
      .maybeSingle();

    return successResponse(
      { 
        applicationId: data.id,
        organizationName,
        hasVoiceAgent: !!voiceAgent
      },
      'Application submitted successfully',
      undefined,
      origin || undefined
    );

  } catch (error) {
    const err = error as Error;
    logger.error('Error processing application', err);
    return errorResponse('Internal server error', 500, { details: err.message }, req.headers.get('origin') || undefined);
  }
});
