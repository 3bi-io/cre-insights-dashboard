/**
 * Inbound Applications Webhook Edge Function
 * Handles incoming application webhooks from external sources
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors-config.ts";
import { successResponse, errorResponse, validationErrorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/logger.ts";
import { getServiceClient } from "../_shared/supabase-client.ts";
import { 
  normalizePhone, 
  findOrCreateJobListing, 
  findClientByIdentifier,
  insertApplication,
  getOrganizationFromJobId 
} from "../_shared/application-processor.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const logger = createLogger('inbound-applications');

// ============================================================
// KNOWN INTEGRATION PARTNERS
// Maps domain signatures to official source names
// ============================================================
const INTEGRATION_SIGNATURES: Record<string, { source: string; requiresScreening: boolean }> = {
  'cdljobcast.com': { source: 'CDL Job Cast', requiresScreening: false },
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

// Reserved source values that require full screening data
const RESERVED_SOURCES = ['Direct Application'];

/**
 * Detect integration source from request headers
 */
const detectIntegrationSource = (origin: string | null, referer: string | null, userAgent: string | null): string | null => {
  const combined = `${origin || ''} ${referer || ''} ${userAgent || ''}`.toLowerCase();
  for (const [domain, config] of Object.entries(INTEGRATION_SIGNATURES)) {
    if (combined.includes(domain)) {
      return config.source;
    }
  }
  return null;
};

/**
 * Check if request is from our native /apply form
 */
const isNativeApplyForm = (origin: string | null, referer: string | null): boolean => {
  const combined = `${origin || ''} ${referer || ''}`.toLowerCase();
  return combined.includes('applyai.jobs') || 
         combined.includes('localhost');
};

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
  driver_type: z.string().optional(), // Company Driver or Owner-Operator
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
 * Verify ElevenLabs webhook signature
 * Format: "t=timestamp,v0=hash"
 * The signature is HMAC-SHA256(timestamp.payload, secret)
 */
const verifyElevenLabsSignature = async (
  payload: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> => {
  if (!signatureHeader || !secret) return false;
  
  try {
    // Parse the signature header: "t=timestamp,v0=hash"
    const parts: Record<string, string> = {};
    signatureHeader.split(',').forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) {
        parts[key.trim()] = value.trim();
      }
    });
    
    const timestamp = parts['t'];
    const providedHash = parts['v0'];
    
    if (!timestamp || !providedHash) {
      logger.error('ElevenLabs signature missing timestamp or hash', { parts });
      return false;
    }
    
    // Check timestamp is within 5 minutes to prevent replay attacks
    const timestampSeconds = parseInt(timestamp, 10);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSeconds - timestampSeconds) > 300) {
      logger.error('ElevenLabs signature timestamp too old', { timestamp, now: nowSeconds });
      return false;
    }
    
    // Compute expected signature: HMAC-SHA256(timestamp.payload, secret)
    const signedPayload = `${timestamp}.${payload}`;
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
      encoder.encode(signedPayload)
    );
    
    const expectedHash = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const isValid = expectedHash === providedHash;
    if (!isValid) {
      logger.error('ElevenLabs signature mismatch', { expected: expectedHash.substring(0, 16) + '...', provided: providedHash.substring(0, 16) + '...' });
    }
    
    return isValid;
  } catch (error) {
    logger.error('ElevenLabs signature verification error', { error });
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

    // Verify ElevenLabs webhook signature if present
    const elevenLabsSignature = req.headers.get('elevenlabs-signature');
    const elevenLabsSecret = Deno.env.get('ELEVENLABS_WEBHOOK_SECRET');
    
    if (elevenLabsSignature) {
      if (!elevenLabsSecret) {
        logger.error('ElevenLabs signature present but ELEVENLABS_WEBHOOK_SECRET not configured');
        return errorResponse('Webhook secret not configured', 500, undefined, origin);
      }
      const isValid = await verifyElevenLabsSignature(rawBody, elevenLabsSignature, elevenLabsSecret);
      if (!isValid) {
        logger.error('Invalid ElevenLabs webhook signature');
        return errorResponse('Invalid webhook signature', 401, undefined, origin);
      }
      logger.info('ElevenLabs webhook signature verified');
    }
    
    // Optional: Verify generic webhook signature if provided
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
      
      // Expanded CDL field mapping to capture partner-specific field names
      cdl: extractValue(body, [
        'cdl', 'cdl_license', 'has_cdl', 
        'cdl_a', 'class_a_cdl', 'has_class_a', 'cdl_status',
        'ClassACDL', 'class_a', 'has_cdl_a', 'CDL', 'HasCDL',
        'cdl_type', 'license_type', 'cdl_holder'
      ]),
      cdl_class: extractValue(body, [
        'cdl_class', 'cdlClass', 'license_class',
        'CDLClass', 'class_type', 'license_type', 'cdl_license_class'
      ]),
      cdl_state: extractValue(body, [
        'cdl_state', 'cdlState', 'license_state',
        'CDLState', 'state_of_license', 'licensing_state'
      ]),
      // Expanded experience field mapping for CDL Jobcast variations
      exp: extractValue(body, [
        'exp', 'experience', 'years_experience', 'yearsExperience',
        'driving_experience', 'months_experience', 'experience_months',
        'DrivingExperience', 'cdl_experience', 'trucking_experience',
        'Experience', 'YearsOfExperience', 'TruckingExperience',
        'otr_experience', 'cdl_years', 'years_driving'
      ]),
      
      age: extractValue(body, ['age', 'over_21', 'over21']),
      veteran: extractValue(body, ['veteran', 'military', 'military_service']),
      education_level: extractValue(body, ['education_level', 'education', 'educationLevel']),
      work_authorization: extractValue(body, ['work_authorization', 'workAuthorization', 'authorized']),
      
      consent: extractValue(body, ['consent', 'agree', 'consent_to_contact']),
      drug: extractValue(body, ['drug', 'drug_test', 'can_pass_drug_test']),
      privacy: extractValue(body, ['privacy', 'privacy_policy', 'agree_privacy']),
      convicted_felony: extractValue(body, ['convicted_felony', 'felony', 'criminal_history']),
      
      source: extractValue(body, ['source', 'referrer']) || 'CDL Job Cast',
      ad_id: extractValue(body, ['ad_id', 'adId', 'advertisement_id']),
      campaign_id: extractValue(body, ['campaign_id', 'campaignId']),
      adset_id: extractValue(body, ['adset_id', 'adsetId', 'ad_set_id']),
      
      // UTM parameters for marketing attribution
      utm_source: extractValue(body, ['utm_source', 'utmSource']),
      utm_medium: extractValue(body, ['utm_medium', 'utmMedium']),
      utm_campaign: extractValue(body, ['utm_campaign', 'utmCampaign', 'campaign_name']),
      
      organization_id: extractValue(body, ['organization_id', 'organizationId', 'org_id']),
      organization_slug: extractValue(body, ['organization_slug', 'organizationSlug', 'org_slug']),
      
      client_name: extractValue(body, ['client_name', 'clientName', 'client', 'company_name']),
      client_slug: extractValue(body, ['client_slug', 'clientSlug']),
      client_company: extractValue(body, ['client_company', 'company']),
      
      notes: extractValue(body, ['notes', 'comments', 'message']),
      status: extractValue(body, ['status']) || 'pending',
      driver_type: extractValue(body, ['driver_type', 'driverType', 'DriverType']),
      cdl_endorsements: undefined as string[] | undefined,
      elevenlabs_call_transcript: undefined as string | undefined,
    };

    // Extract ElevenLabs agent ID for organization resolution
    const elevenLabsAgentId = extractValue(body, ['agent_id', 'agentId']) || 
                              (body.data as Record<string, unknown> | undefined)?.agent_id as string | undefined;
    
    if (elevenLabsAgentId) {
      logger.info('ElevenLabs agent ID detected', { agentId: elevenLabsAgentId });
    }

    // Extract ElevenLabs transcript and structured data if present
    const elevenLabsData = body.data as Record<string, unknown> | undefined;
    if (elevenLabsData) {
      const transcript = elevenLabsData.transcript as Array<{ role: string; message: string }> | undefined;
      const analysis = elevenLabsData.analysis as Record<string, unknown> | undefined;
      const transcriptSummary = analysis?.transcript_summary as string | undefined;
      
      // ============================================================
      // CRITICAL: Extract structured data from data_collection_results
      // This is where ElevenLabs stores collected applicant fields
      // ============================================================
      const dataCollectionResults = analysis?.data_collection_results as Record<string, unknown> | undefined;
      
      if (dataCollectionResults) {
        logger.info('ElevenLabs data_collection_results found', { 
          fields: Object.keys(dataCollectionResults),
          values: dataCollectionResults
        });
        
        // Map ElevenLabs collected fields to application data
        // Priority: data_collection_results > top-level body fields
        
        // GivenName (First Name)
        if (!applicationData.first_name) {
          applicationData.first_name = extractValue(dataCollectionResults, ['GivenName', 'givenName', 'first_name', 'firstName']);
        }
        
        // FamilyName (Last Name)
        if (!applicationData.last_name) {
          applicationData.last_name = extractValue(dataCollectionResults, ['FamilyName', 'familyName', 'last_name', 'lastName']);
        }
        
        // PostalCode (5-digit Zip)
        if (!applicationData.zip) {
          applicationData.zip = extractValue(dataCollectionResults, ['PostalCode', 'postalCode', 'zip', 'zipcode']);
        }
        
        // Class_A_CDL (Boolean: Yes/No)
        if (!applicationData.cdl) {
          applicationData.cdl = extractValue(dataCollectionResults, ['Class_A_CDL', 'class_a_cdl', 'cdl', 'has_cdl']);
        }
        
        // Class_A_CDL_Experience (String: e.g., "2 years")
        if (!applicationData.exp) {
          applicationData.exp = extractValue(dataCollectionResults, ['Class_A_CDL_Experience', 'experience', 'exp', 'years_experience']);
        }
        
        // DriverType (Enum: "Company Driver" or "Owner-Operator")
        if (!applicationData.driver_type) {
          applicationData.driver_type = extractValue(dataCollectionResults, ['DriverType', 'driver_type', 'driverType']);
        }
        
        // PrimaryPhone (Validated phone number)
        if (!applicationData.phone) {
          applicationData.phone = extractValue(dataCollectionResults, ['PrimaryPhone', 'phone', 'phoneNumber', 'primary_phone']);
        }
        
        // InternetEmailAddress (Validated email)
        if (!applicationData.applicant_email) {
          applicationData.applicant_email = extractValue(dataCollectionResults, ['InternetEmailAddress', 'email', 'emailAddress', 'internet_email_address']);
        }
        
        // CanPassDrug (Boolean: Yes/No)
        if (!applicationData.drug) {
          applicationData.drug = extractValue(dataCollectionResults, ['CanPassDrug', 'can_pass_drug_test', 'drug', 'canPassDrug']);
        }
        
        // Veteran_Status (Boolean: Yes/No)
        if (!applicationData.veteran) {
          applicationData.veteran = extractValue(dataCollectionResults, ['Veteran_Status', 'veteran', 'is_veteran', 'veteranStatus']);
        }
        
        // consentGiven (Boolean: Yes/No - MUST be explicit)
        if (!applicationData.consent) {
          applicationData.consent = extractValue(dataCollectionResults, ['consentGiven', 'consent', 'agree', 'consent_given']);
        }
        // Log missing data collection fields for monitoring
        const expectedFieldsMap = {
          first_name: 'GivenName',
          last_name: 'FamilyName', 
          zip: 'PostalCode',
          cdl: 'Class_A_CDL',
          exp: 'Class_A_CDL_Experience',
          driver_type: 'DriverType',
          phone: 'PrimaryPhone',
          applicant_email: 'InternetEmailAddress',
          drug: 'CanPassDrug',
          veteran: 'Veteran_Status',
          consent: 'consentGiven'
        };

        const missingFields: string[] = [];
        const collectedFields: string[] = [];

        for (const [appField, elevenLabsField] of Object.entries(expectedFieldsMap)) {
          if (applicationData[appField as keyof typeof applicationData]) {
            collectedFields.push(elevenLabsField);
          } else {
            missingFields.push(elevenLabsField);
          }
        }

        if (missingFields.length > 0) {
          logger.warn('Missing data collection fields from ElevenLabs', {
            conversationId: elevenLabsData.conversation_id,
            agentId: elevenLabsAgentId,
            missingFields,
            collectedFields,
            completeness: `${collectedFields.length}/11`,
            rawDataCollectionKeys: Object.keys(dataCollectionResults || {})
          });
        } else {
          logger.info('All expected data collection fields received', {
            conversationId: elevenLabsData.conversation_id,
            agentId: elevenLabsAgentId,
            collectedFields
          });
        }
      } else {
        logger.info('No data_collection_results in ElevenLabs payload', {
          hasAnalysis: !!analysis,
          analysisKeys: analysis ? Object.keys(analysis) : []
        });
      }
      
      // Extract additional call metadata
      const callDuration = elevenLabsData.call_duration_secs as number | undefined;
      const callStatus = elevenLabsData.status as string | undefined;
      const conversationId = elevenLabsData.conversation_id as string | undefined;
      
      if (transcript && Array.isArray(transcript)) {
        // Format transcript as readable text
        const formattedTranscript = transcript
          .map(entry => `${entry.role === 'agent' ? 'Agent' : 'Caller'}: ${entry.message}`)
          .join('\n');
        
        // Combine summary and full transcript
        const transcriptParts: string[] = [];
        if (transcriptSummary) {
          transcriptParts.push(`=== Summary ===\n${transcriptSummary}`);
        }
        transcriptParts.push(`=== Full Transcript ===\n${formattedTranscript}`);
        
        applicationData.elevenlabs_call_transcript = transcriptParts.join('\n\n');
        logger.info('ElevenLabs transcript captured', { 
          messageCount: transcript.length,
          hasSummary: !!transcriptSummary 
        });
      }
      
      // Add call metadata to notes
      const callMetadata: string[] = [];
      if (conversationId) callMetadata.push(`Conversation ID: ${conversationId}`);
      if (callDuration) callMetadata.push(`Call Duration: ${Math.floor(callDuration / 60)}m ${Math.round(callDuration % 60)}s`);
      if (callStatus) callMetadata.push(`Call Status: ${callStatus}`);
      
      if (callMetadata.length > 0) {
        const metadataNote = `--- ElevenLabs Call Info ---\n${callMetadata.join('\n')}`;
        applicationData.notes = applicationData.notes 
          ? `${applicationData.notes}\n\n${metadataNote}`
          : metadataNote;
      }
      
      // If source not explicitly set but this is ElevenLabs data, set source
      if (!applicationData.source || applicationData.source === 'CDL Job Cast') {
        applicationData.source = 'ElevenLabs';
      }
    }

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

    // ============================================================
    // SOURCE VALIDATION & EXTERNAL DETECTION
    // Prevent external integrations from spoofing "Direct Application"
    // ============================================================
    const requestOrigin = req.headers.get('origin');
    const requestReferer = req.headers.get('referer');
    const requestUserAgent = req.headers.get('user-agent');
    
    // Check if this is truly from our native form
    const isNative = isNativeApplyForm(requestOrigin, requestReferer);
    
    // Detect known integration partner
    const detectedIntegration = detectIntegrationSource(requestOrigin, requestReferer, requestUserAgent);
    
    // Handle source validation
    if (applicationData.source === 'Direct Application') {
      if (!isNative) {
        // External source claiming to be Direct Application
        logger.warn('External source claiming Direct Application', {
          origin: requestOrigin,
          referer: requestReferer,
          userAgent: requestUserAgent?.substring(0, 100),
          detectedIntegration
        });
        
        // Check for required screening fields
        const missingScreeningFields: string[] = [];
        if (!applicationData.cdl) missingScreeningFields.push('cdl');
        if (!applicationData.drug) missingScreeningFields.push('drug');
        if (!applicationData.consent) missingScreeningFields.push('consent');
        
        if (missingScreeningFields.length > 0) {
          logger.error('Direct Application source missing required screening fields', {
            missingFields: missingScreeningFields,
            source: applicationData.source,
            isNative: false
          });
          
          return validationErrorResponse(
            `Source "Direct Application" requires screening fields: ${missingScreeningFields.join(', ')}. ` +
            `Either include these fields or use a different source value (e.g., your company name).`,
            origin
          );
        }
        
        // If they provided all required fields, override source to track it
        applicationData.source = detectedIntegration || 'External Webhook';
        logger.info('Source overridden from Direct Application', {
          newSource: applicationData.source,
          reason: 'External request with complete screening data'
        });
      }
    } else if (detectedIntegration && !applicationData.source) {
      // Auto-assign source based on detected integration
      applicationData.source = detectedIntegration;
      logger.info('Source auto-detected from integration', { source: applicationData.source });
    }

    // Determine organization - priority order:
    // 1. Explicit org_id in query params or body
    // 2. Resolve from ElevenLabs agent_id via voice_agents table
    // 3. Resolve from organization_slug
    // 4. Return error if no organization can be determined
    let organizationId = applicationData.organization_id;
    let resolvedClientId: string | null = null;
    let resolvedFrom = 'explicit';
    
    logger.info('Organization resolution starting', {
      hasExplicitOrgId: !!applicationData.organization_id,
      hasElevenLabsAgentId: !!elevenLabsAgentId,
      hasOrganizationSlug: !!applicationData.organization_slug,
      source: applicationData.source,
    });
    
    // Check for source-specific organization override FIRST
    // CDL Job Cast applications ALWAYS go to Hayes regardless of other params
    if (applicationData.source && SOURCE_ORGANIZATION_OVERRIDES[applicationData.source]) {
      const overrideOrg = SOURCE_ORGANIZATION_OVERRIDES[applicationData.source];
      
      if (organizationId && organizationId !== overrideOrg) {
        logger.warn('Organization override applied - source requires specific org', {
          source: applicationData.source,
          requestedOrgId: organizationId,
          enforcedOrgId: overrideOrg
        });
      }
      
      organizationId = overrideOrg;
      resolvedFrom = 'source_override';
      
      logger.info('Organization enforced by source override', {
        source: applicationData.source,
        organizationId,
        organizationName: 'Hayes Recruiting Solutions'
      });
      
      // ============================================================
      // CDL JOB CAST PAYLOAD ANALYSIS
      // Log detailed field information to identify unmapped field names
      // ============================================================
      if (applicationData.source === 'CDL Job Cast') {
        const allFieldNames = Object.keys(body);
        
        // Find fields that might contain CDL or experience data
        const potentialCDLFields = Object.entries(body)
          .filter(([key]) => {
            const lowerKey = key.toLowerCase();
            return lowerKey.includes('cdl') || 
                   lowerKey.includes('experience') ||
                   lowerKey.includes('license') ||
                   lowerKey.includes('exp') ||
                   lowerKey.includes('years') ||
                   lowerKey.includes('driving');
          })
          .map(([key, value]) => ({ field: key, value: String(value).substring(0, 100) }));
        
        logger.info('CDL Job Cast payload analysis', {
          totalFields: allFieldNames.length,
          allFieldNames,
          potentialCDLFields,
          extractedCDL: applicationData.cdl || 'NOT FOUND',
          extractedExp: applicationData.exp || 'NOT FOUND',
          extractedCDLClass: applicationData.cdl_class || 'NOT FOUND',
          extractedCDLState: applicationData.cdl_state || 'NOT FOUND',
        });
      }
    }
    
    // Try to resolve from ElevenLabs agent ID via voice_agents table
    if (!organizationId && elevenLabsAgentId) {
      const { data: voiceAgent } = await supabase
        .from('voice_agents')
        .select('organization_id, client_id')
        .or(`agent_id.eq.${elevenLabsAgentId},elevenlabs_agent_id.eq.${elevenLabsAgentId}`)
        .eq('is_active', true)
        .single();
      
      if (voiceAgent?.organization_id) {
        organizationId = voiceAgent.organization_id;
        resolvedClientId = voiceAgent.client_id;
        resolvedFrom = 'agent_lookup';
        logger.info('Resolved organization from ElevenLabs agent', {
          agentId: elevenLabsAgentId,
          organizationId,
          clientId: resolvedClientId
        });
      } else {
        // Log unknown agent for monitoring - this agent needs to be registered
        logger.error('Unknown ElevenLabs agent - not registered in voice_agents', {
          agentId: elevenLabsAgentId,
          conversationId: elevenLabsData?.conversation_id,
          recommendation: 'Add this agent to the voice_agents table with organization_id'
        });
      }
    }
    
    // Try to resolve from organization slug
    if (!organizationId && applicationData.organization_slug) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', applicationData.organization_slug)
        .single();
      
      if (org?.id) {
        organizationId = org.id;
        resolvedFrom = 'slug_lookup';
        logger.info('Resolved organization from slug', { slug: applicationData.organization_slug, id: organizationId });
      }
    }
    
    // Priority: Infer organization from job_id prefix (catches misrouted applications)
    if (!organizationId && applicationData.job_id) {
      const inferredOrgId = getOrganizationFromJobId(applicationData.job_id);
      if (inferredOrgId) {
        organizationId = inferredOrgId;
        resolvedFrom = 'job_id_prefix';
        logger.info('Resolved organization from job_id prefix', { 
          jobId: applicationData.job_id, 
          organizationId 
        });
      }
    }
    
    // If still no organization, return error instead of defaulting
    if (!organizationId) {
      logger.error('Could not determine organization for application', {
        hasAgentId: !!elevenLabsAgentId,
        hasOrgSlug: !!applicationData.organization_slug,
        hasJobId: !!applicationData.job_id,
        source: applicationData.source
      });
      return errorResponse(
        'Organization could not be determined. Please include org_id in webhook URL or configure agent in voice_agents table.',
        400,
        { 
          hint: 'Add organization_id to your webhook payload or configure the voice agent with an organization.',
          receivedAgentId: elevenLabsAgentId 
        },
        origin
      );
    }
    
    logger.info('Application routing resolved', {
      source: applicationData.source,
      organizationId,
      clientId: resolvedClientId,
      resolvedFrom,
      elevenLabsAgentId: elevenLabsAgentId || null
    });

    // Look up client - prefer resolved from agent, then by identifier
    let clientId = resolvedClientId;
    if (!clientId) {
      const clientIdentifier = applicationData.client_name || 
                               applicationData.client_slug || 
                               applicationData.client_company;
      clientId = await findClientByIdentifier(supabase, organizationId, clientIdentifier);
    }

    // Find or create job listing using shared processor
    const jobListingResult = await findOrCreateJobListing(supabase, {
      jobListingId: applicationData.job_listing_id,
      jobId: applicationData.job_id,
      jobTitle: applicationData.job_title,
      organizationId,
      clientId,
      city: applicationData.city,
      state: applicationData.state,
      source: applicationData.source,
    });

    if (!jobListingResult) {
      return errorResponse('Unable to create job listing', 500, undefined, origin);
    }
    
    const jobListingId = jobListingResult.id;
    
    logger.info('Job listing resolved', {
      jobListingId,
      matchType: jobListingResult.matchType,
      providedJobId: applicationData.job_id,
      source: applicationData.source
    });

    // ============================================================
    // UTM PARAMETER RESOLUTION
    // Priority: Explicit params > URL query params > Source-based defaults
    // ============================================================
    let utmSource = applicationData.utm_source || url.searchParams.get('utm_source');
    let utmMedium = applicationData.utm_medium || url.searchParams.get('utm_medium');
    let utmCampaign = applicationData.utm_campaign || url.searchParams.get('utm_campaign');
    
    // Apply source-based defaults for CDL Job Cast
    if (applicationData.source === 'CDL Job Cast') {
      utmSource = utmSource || 'cdl_jobcast';
      utmMedium = utmMedium || 'job_board';
      
      // Auto-generate campaign if not provided
      if (!utmCampaign) {
        const clientSlug = (applicationData.client_name || 'unknown')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .substring(0, 30);
        const quarter = `q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
        const year = new Date().getFullYear();
        utmCampaign = `${clientSlug}_${quarter}_${year}`;
      }
    }

    logger.info('UTM attribution resolved', {
      source: applicationData.source,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
    });

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
      driver_type: applicationData.driver_type,
      
      // UTM attribution fields
      utm_source: utmSource || null,
      utm_medium: utmMedium || null,
      utm_campaign: utmCampaign || null,
      
      notes: applicationData.notes,
      status: applicationData.status,
      applied_at: new Date().toISOString(),
      elevenlabs_call_transcript: applicationData.elevenlabs_call_transcript,
    };

    // Insert application using shared processor
    const { data: application, error: insertError } = await insertApplication(supabase, applicationRecord);

    if (insertError) {
      logger.error('Error inserting application', { error: insertError });
      return errorResponse('Failed to create application', 500, { details: insertError.message }, origin);
    }

    // ============================================================
    // DATA QUALITY MONITORING
    // Log completeness metrics for integration health tracking
    // ============================================================
    const dataQualityFields = {
      cdl: !!applicationData.cdl,
      drug: !!applicationData.drug,
      consent: !!applicationData.consent,
      phone: !!applicationData.phone,
      city: !!applicationData.city,
      exp: !!applicationData.exp,
      zip: !!applicationData.zip,
      state: !!applicationData.state,
    };
    
    const completedFields = Object.values(dataQualityFields).filter(Boolean).length;
    const totalFields = Object.keys(dataQualityFields).length;
    const qualityScore = Math.round((completedFields / totalFields) * 100);
    
    const missingDataFields = Object.entries(dataQualityFields)
      .filter(([_, present]) => !present)
      .map(([field]) => field);
    
    logger.info('Application created successfully', { 
      id: application.id,
      source: applicationData.source,
      dataQuality: {
        score: `${qualityScore}%`,
        completedFields: `${completedFields}/${totalFields}`,
        missingFields: missingDataFields.length > 0 ? missingDataFields : 'none'
      }
    });
    
    // Warn on low quality submissions
    if (qualityScore < 50) {
      logger.warn('Low data quality application received', {
        applicationId: application.id,
        source: applicationData.source,
        qualityScore: `${qualityScore}%`,
        missingFields: missingDataFields
      });
    }

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
