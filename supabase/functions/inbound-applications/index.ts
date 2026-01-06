/**
 * Inbound Applications Webhook Edge Function
 * Handles incoming application webhooks from external sources
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { successResponse, errorResponse, validationErrorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/logger.ts";
import { 
  normalizePhone, 
  findOrCreateJobListing, 
  findClientByIdentifier,
  insertApplication 
} from "../_shared/application-processor.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const logger = createLogger('inbound-applications');

// Input validation schema
const InboundApplicationSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  full_name: z.string().optional(),
  applicant_email: z.string().email().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  address_1: z.string().optional(),
  address_2: z.string().optional(),
  country: z.string().optional(),
  job_listing_id: z.string().uuid().optional(),
  job_id: z.string().optional(),
  job_title: z.string().optional(),
  cdl: z.string().optional(),
  cdl_class: z.string().optional(),
  cdl_state: z.string().optional(),
  cdl_endorsements: z.union([z.array(z.string()), z.string()]).optional(),
  exp: z.string().optional(),
  age: z.string().optional(),
  veteran: z.string().optional(),
  education_level: z.string().optional(),
  work_authorization: z.string().optional(),
  consent: z.string().optional(),
  drug: z.string().optional(),
  privacy: z.string().optional(),
  convicted_felony: z.string().optional(),
  source: z.string().optional(),
  ad_id: z.string().optional(),
  campaign_id: z.string().optional(),
  adset_id: z.string().optional(),
  organization_id: z.string().uuid().optional(),
  organization_slug: z.string().optional(),
  client_name: z.string().optional(),
  client_slug: z.string().optional(),
  client_company: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
}).passthrough();

/**
 * Verify webhook signature for security using Web Crypto API
 */
const verifyWebhookSignature = async (
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> => {
  if (!signature || !secret) return false;
  
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payload)
    );
    
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return signature === expectedSignature;
  } catch (error) {
    logger.error('Signature verification error', { error });
    return false;
  }
};

/**
 * Extract value from multiple possible field names
 */
const extractValue = (data: Record<string, unknown>, fieldNames: string[]): string | undefined => {
  for (const fieldName of fieldNames) {
    if (data[fieldName] !== undefined && data[fieldName] !== null) {
      const value = String(data[fieldName]).trim();
      if (value) return value;
    }
  }
  return undefined;
};

/**
 * Trigger webhooks for applications matching the source filter
 */
async function triggerSourceWebhooks(
  supabase: ReturnType<typeof createClient>, 
  applicationId: string, 
  source: string
): Promise<void> {
  logger.info('Triggering webhooks', { applicationId, source });
  
  const { data: webhooks, error: webhookError } = await supabase
    .from('client_webhooks')
    .select('id, webhook_url, event_types, source_filter, secret_key')
    .eq('enabled', true);

  if (webhookError) {
    logger.error('Error fetching webhooks', { error: webhookError });
    return;
  }

  if (!webhooks || webhooks.length === 0) {
    logger.info('No enabled webhooks found');
    return;
  }

  const matchingWebhooks = webhooks.filter((webhook: Record<string, unknown>) => {
    const sourceFilter = webhook.source_filter as string[] | null;
    const eventTypes = webhook.event_types as string[] | null;
    const hasMatchingSource = sourceFilter && sourceFilter.includes(source);
    const hasCreatedEvent = !eventTypes || eventTypes.length === 0 || eventTypes.includes('created');
    return hasMatchingSource && hasCreatedEvent;
  });

  if (matchingWebhooks.length === 0) {
    logger.info('No webhooks match source filter', { source });
    return;
  }

  logger.info(`Found ${matchingWebhooks.length} matching webhooks for source: ${source}`);

  const { data: application, error: appError } = await supabase
    .from('applications')
    .select(`
      *,
      job_listings (
        id, title, city, state, organization_id,
        clients (id, name, company)
      )
    `)
    .eq('id', applicationId)
    .single();

  if (appError || !application) {
    logger.error('Error fetching application for webhook', { error: appError });
    return;
  }

  for (const webhook of matchingWebhooks) {
    const startTime = Date.now();
    let responseStatus: number | null = null;
    let responseBody: string | null = null;
    let errorMessage: string | null = null;

    try {
      const payload = {
        event_type: 'created',
        timestamp: new Date().toISOString(),
        application: {
          id: application.id,
          first_name: application.first_name,
          last_name: application.last_name,
          full_name: application.full_name,
          email: application.applicant_email,
          phone: application.phone,
          city: application.city,
          state: application.state,
          zip: application.zip,
          cdl: application.cdl,
          cdl_class: application.cdl_class,
          exp: application.exp,
          source: application.source,
          status: application.status,
          applied_at: application.applied_at,
          created_at: application.created_at,
        },
        job_listing: application.job_listings ? {
          id: application.job_listings.id,
          title: application.job_listings.title,
          city: application.job_listings.city,
          state: application.job_listings.state,
        } : null,
        client: application.job_listings?.clients ? {
          id: application.job_listings.clients.id,
          name: application.job_listings.clients.name,
          company: application.job_listings.clients.company,
        } : null,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (webhook.secret_key) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(webhook.secret_key as string),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const signatureBuffer = await crypto.subtle.sign(
          "HMAC",
          key,
          encoder.encode(JSON.stringify(payload))
        );
        const signature = Array.from(new Uint8Array(signatureBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        headers['X-Webhook-Signature'] = signature;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(webhook.webhook_url as string, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      responseStatus = response.status;
      responseBody = await response.text().catch(() => null);

      logger.info(`Webhook ${webhook.id} response`, { status: responseStatus });

      const updateData: Record<string, unknown> = {
        last_triggered_at: new Date().toISOString(),
      };

      if (response.ok) {
        updateData.last_success_at = new Date().toISOString();
        updateData.last_error = null;
      } else {
        updateData.last_error = `HTTP ${responseStatus}: ${responseBody?.substring(0, 200)}`;
      }

      await supabase
        .from('client_webhooks')
        .update(updateData)
        .eq('id', webhook.id);

    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Webhook ${webhook.id} failed`, { error: errorMessage });

      await supabase
        .from('client_webhooks')
        .update({
          last_triggered_at: new Date().toISOString(),
          last_error: errorMessage,
        })
        .eq('id', webhook.id);
    }

    const durationMs = Date.now() - startTime;
    await supabase.from('client_webhook_logs').insert({
      webhook_id: webhook.id,
      application_id: applicationId,
      event_type: 'created',
      request_payload: { source, application_id: applicationId },
      response_status: responseStatus,
      response_body: responseBody?.substring(0, 1000),
      error_message: errorMessage,
      duration_ms: durationMs,
    });
  }

  logger.info('Webhook triggering complete');
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin') || '*';
  const corsHeaders = getCorsHeaders(origin);

  logger.info('Inbound application webhook received', {
    method: req.method,
    url: req.url,
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, { allowed_methods: ['POST'] }, origin);
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse URL query parameters FIRST
    const url = new URL(req.url);
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    if (Object.keys(queryParams).length > 0) {
      logger.info('URL query parameters', { params: queryParams });
    }

    // Parse request body
    const rawBody = await req.text();
    const contentType = req.headers.get('content-type') || '';
    let body: Record<string, unknown> = {};

    logger.info('Content-Type', { contentType });

    if (contentType.includes('application/json')) {
      body = JSON.parse(rawBody);
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(rawBody);
      body = Object.fromEntries(params);
    } else {
      try {
        body = JSON.parse(rawBody);
      } catch {
        const params = new URLSearchParams(rawBody);
        body = Object.fromEntries(params);
      }
    }

    // Merge query parameters with body (body takes precedence for security)
    body = { ...queryParams, ...body };

    logger.info('Parsed webhook data', { 
      keys: Object.keys(body),
      hasQueryParams: Object.keys(queryParams).length > 0
    });

    // Optional: Verify webhook signature if provided
    const signature = req.headers.get('x-webhook-signature');
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    
    if (webhookSecret && signature) {
      const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        logger.error('Invalid webhook signature');
        return errorResponse('Invalid webhook signature', 401, undefined, origin);
      }
      logger.info('Webhook signature verified');
    }

    // Extract application data with flexible field mapping
    const applicationData = {
      first_name: extractValue(body, ['first_name', 'firstName', 'fname', 'givenName']),
      last_name: extractValue(body, ['last_name', 'lastName', 'lname', 'familyName']),
      full_name: extractValue(body, ['full_name', 'fullName', 'name', 'applicant_name']),
      applicant_email: extractValue(body, ['applicant_email', 'email', 'emailAddress', 'e_mail']),
      phone: extractValue(body, ['phone', 'phone_number', 'phoneNumber', 'mobile', 'cell']),
      
      city: extractValue(body, ['city', 'location_city', 'applicant_city']),
      state: extractValue(body, ['state', 'location_state', 'applicant_state']),
      zip: extractValue(body, ['zip', 'zipcode', 'postal_code', 'postalCode']),
      address_1: extractValue(body, ['address_1', 'address', 'street', 'street_address']),
      address_2: extractValue(body, ['address_2', 'address_line_2', 'apt', 'suite']),
      country: extractValue(body, ['country', 'country_code']) || 'US',
      
      job_listing_id: extractValue(body, ['job_listing_id', 'jobListingId', 'job_id', 'jobId']),
      job_id: extractValue(body, ['job_id', 'jobId', 'reference_number', 'referenceNumber']),
      job_title: extractValue(body, ['job_title', 'jobTitle', 'position', 'title']),
      
      cdl: extractValue(body, ['cdl', 'cdl_license', 'has_cdl']),
      cdl_class: extractValue(body, ['cdl_class', 'cdlClass', 'license_class']),
      cdl_state: extractValue(body, ['cdl_state', 'cdlState', 'license_state']),
      exp: extractValue(body, ['exp', 'experience', 'years_experience', 'yearsExperience']),
      
      age: extractValue(body, ['age', 'over_21', 'over21']),
      veteran: extractValue(body, ['veteran', 'military', 'military_service']),
      education_level: extractValue(body, ['education_level', 'education', 'educationLevel']),
      work_authorization: extractValue(body, ['work_authorization', 'workAuthorization', 'authorized']),
      
      consent: extractValue(body, ['consent', 'agree', 'consent_to_contact']),
      drug: extractValue(body, ['drug', 'drug_test', 'can_pass_drug_test']),
      privacy: extractValue(body, ['privacy', 'privacy_policy', 'agree_privacy']),
      convicted_felony: extractValue(body, ['convicted_felony', 'felony', 'criminal_history']),
      
      source: extractValue(body, ['source', 'utm_source', 'referrer']) || 'CDL Job Cast',
      ad_id: extractValue(body, ['ad_id', 'adId', 'advertisement_id']),
      campaign_id: extractValue(body, ['campaign_id', 'campaignId', 'utm_campaign']),
      adset_id: extractValue(body, ['adset_id', 'adsetId', 'ad_set_id']),
      
      organization_id: extractValue(body, ['organization_id', 'organizationId', 'org_id']),
      organization_slug: extractValue(body, ['organization_slug', 'organizationSlug', 'org_slug']),
      
      client_name: extractValue(body, ['client_name', 'clientName', 'client', 'company_name']),
      client_slug: extractValue(body, ['client_slug', 'clientSlug']),
      client_company: extractValue(body, ['client_company', 'company']),
      
      notes: extractValue(body, ['notes', 'comments', 'message']),
      status: extractValue(body, ['status']) || 'pending',
      cdl_endorsements: undefined as string[] | undefined,
    };

    // Parse CDL endorsements if provided
    if (body.cdl_endorsements) {
      if (Array.isArray(body.cdl_endorsements)) {
        applicationData.cdl_endorsements = body.cdl_endorsements as string[];
      } else if (typeof body.cdl_endorsements === 'string') {
        applicationData.cdl_endorsements = (body.cdl_endorsements as string).split(',').map(e => e.trim());
      }
    }

    // Validate required fields
    const email = applicationData.applicant_email;
    const validationErrors: string[] = [];
    
    if (!email) {
      validationErrors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.push('Invalid email format');
    }
    
    if (!applicationData.first_name && !applicationData.full_name) {
      validationErrors.push('First name or full name is required');
    }
    
    if (applicationData.phone) {
      const phoneDigits = applicationData.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        validationErrors.push('Phone number must be at least 10 digits');
      }
    }

    if (validationErrors.length > 0) {
      logger.warn('Validation errors', { errors: validationErrors });
      return validationErrorResponse(validationErrors.join(', '), origin);
    }

    // Determine organization - check query params first, then body fields
    let organizationId = applicationData.organization_id;
    
    logger.info('Organization resolution', {
      fromExtraction: applicationData.organization_id,
      fromOrganizationSlug: applicationData.organization_slug,
    });
    
    if (!organizationId && applicationData.organization_slug) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', applicationData.organization_slug)
        .single();
      
      organizationId = org?.id;
      if (organizationId) {
        logger.info('Resolved organization from slug', { slug: applicationData.organization_slug, id: organizationId });
      }
    }
    
    // Default to Hayes Recruiting Solutions
    if (!organizationId) {
      organizationId = '84214b48-7b51-45bc-ad7f-723bcf50466c';
      logger.info('Using default organization', { id: organizationId });
    } else {
      logger.info('Organization resolved', { id: organizationId });
    }

    // Look up client by name or slug
    const clientIdentifier = applicationData.client_name || 
                             applicationData.client_slug || 
                             applicationData.client_company;
    const clientId = await findClientByIdentifier(supabase, organizationId, clientIdentifier);

    // Find or create job listing using shared processor
    const jobListingId = await findOrCreateJobListing(supabase, {
      jobListingId: applicationData.job_listing_id,
      jobId: applicationData.job_id,
      jobTitle: applicationData.job_title,
      organizationId,
      clientId,
      city: applicationData.city,
      state: applicationData.state,
      source: applicationData.source,
    });

    if (!jobListingId) {
      return errorResponse('Unable to create job listing', 500, undefined, origin);
    }

    // Prepare application record
    const applicationRecord = {
      job_listing_id: jobListingId,
      first_name: applicationData.first_name || applicationData.full_name?.split(' ')[0],
      last_name: applicationData.last_name || applicationData.full_name?.split(' ').slice(1).join(' '),
      full_name: applicationData.full_name || `${applicationData.first_name} ${applicationData.last_name}`.trim(),
      applicant_email: applicationData.applicant_email,
      phone: normalizePhone(applicationData.phone),
      
      city: applicationData.city,
      state: applicationData.state,
      zip: applicationData.zip,
      address_1: applicationData.address_1,
      address_2: applicationData.address_2,
      country: applicationData.country,
      
      job_id: applicationData.job_id,
      
      cdl: applicationData.cdl,
      cdl_class: applicationData.cdl_class,
      cdl_state: applicationData.cdl_state,
      cdl_endorsements: applicationData.cdl_endorsements,
      exp: applicationData.exp,
      
      age: applicationData.age,
      veteran: applicationData.veteran,
      education_level: applicationData.education_level,
      work_authorization: applicationData.work_authorization,
      
      consent: applicationData.consent,
      drug: applicationData.drug,
      privacy: applicationData.privacy,
      convicted_felony: applicationData.convicted_felony,
      
      source: applicationData.source,
      ad_id: applicationData.ad_id,
      campaign_id: applicationData.campaign_id,
      adset_id: applicationData.adset_id,
      
      notes: applicationData.notes,
      status: applicationData.status,
      applied_at: new Date().toISOString(),
    };

    // Insert application using shared processor
    const { data: application, error: insertError } = await insertApplication(supabase, applicationRecord);

    if (insertError) {
      logger.error('Error inserting application', { error: insertError });
      return errorResponse('Failed to create application', 500, { details: insertError.message }, origin);
    }

    logger.info('Application created successfully', { id: application.id });

    // Trigger webhooks for this source (non-blocking)
    try {
      await triggerSourceWebhooks(supabase, application.id, applicationData.source || 'CDL Job Cast');
    } catch (webhookError) {
      logger.error('Webhook trigger failed (non-blocking)', { error: webhookError });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Application received and processed',
        application_id: application.id,
        organization_id: organizationId,
        job_listing_id: jobListingId,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    logger.error('Webhook error', { error });
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500,
      undefined,
      origin
    );
  }
};

serve(handler);
