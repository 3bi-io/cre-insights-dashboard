import { getServiceClient } from '../_shared/supabase-client.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { wrapHandler } from '../_shared/error-handler.ts';
import { createLogger } from '../_shared/logger.ts';
import { successResponse, errorResponse, validationErrorResponse } from '../_shared/response.ts';
import { enforceRateLimit, getRateLimitIdentifier } from '../_shared/rate-limiter.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const logger = createLogger('tenstreet-webhook');

// Zod validation schema for Tenstreet webhook data
const TenstreetWebhookSchema = z.object({
  eventType: z.enum(['new_applicant', 'status_update', 'applicant_created', 'extract_complete']),
  driverId: z.string().trim().max(100, 'Driver ID too long'),
  status: z.string().trim().max(50, 'Status too long').optional(),
  personalData: z.object({
    firstName: z.string().trim().max(100, 'First name too long').optional(),
    lastName: z.string().trim().max(100, 'Last name too long').optional(),
    email: z.string().email('Invalid email format').max(255, 'Email too long').optional(),
    phone: z.string().max(50, 'Phone too long').optional(),
  }).optional(),
  applicationData: z.record(z.any()).optional(),
});

Deno.serve(wrapHandler(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Apply rate limiting: 100 webhook calls per minute per IP
  const identifier = getRateLimitIdentifier(req, false);
  try {
    await enforceRateLimit(identifier, {
      maxRequests: 100,
      windowMs: 60000,
      keyPrefix: 'tenstreet-webhook'
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

  const supabaseClient = getServiceClient();

  // Parse incoming Tenstreet webhook
  const contentType = req.headers.get('content-type') || '';
  
  let webhookData;
  if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
    const xmlText = await req.text();
    logger.info('Received Tenstreet webhook XML', { length: xmlText.length });
    webhookData = parseWebhookXML(xmlText);
  } else {
    webhookData = await req.json();
    logger.info('Received Tenstreet webhook JSON', { eventType: webhookData.eventType });
  }

  // Validate webhook data
  const validationResult = TenstreetWebhookSchema.safeParse(webhookData);
  if (!validationResult.success) {
    const errors = validationResult.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
    logger.warn('Validation failed', { errors });
    return validationErrorResponse(errors, origin);
  }

  // Process webhook based on event type
  const result = await processWebhook(supabaseClient, validationResult.data);

  return successResponse({ processed: result }, 'Webhook processed successfully', {}, origin);
}, { context: 'tenstreet-webhook', logRequests: true }));

async function processWebhook(supabaseClient: any, webhookData: any) {
  const { eventType, driverId, status, personalData, applicationData } = webhookData;

  logger.info('Processing webhook', { eventType, driverId, status });

  // Find existing application by driver_id
  const { data: existingApp } = await supabaseClient
    .from('applications')
    .select('id')
    .eq('driver_id', driverId)
    .single();

  if (existingApp) {
    // Update existing application
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = mapTenstreetStatus(status);
    }

    if (personalData) {
      Object.assign(updateData, mapPersonalData(personalData));
    }

    const { data, error } = await supabaseClient
      .from('applications')
      .update(updateData)
      .eq('id', existingApp.id)
      .select();

    if (error) {
      logger.error('Error updating application', error);
      throw error;
    }

    logger.info('Updated application', { applicationId: data[0]?.id });
    return { action: 'updated', applicationId: data[0]?.id };

  } else if (eventType === 'new_applicant' || eventType === 'applicant_created') {
    // Create new application from webhook
    const insertData = {
      driver_id: driverId,
      source: 'Tenstreet',
      status: mapTenstreetStatus(status),
      applied_at: new Date().toISOString(),
      ...mapPersonalData(personalData),
      ...mapApplicationData(applicationData)
    };

    const { data, error } = await supabaseClient
      .from('applications')
      .insert(insertData)
      .select();

    if (error) {
      logger.error('Error creating application', error);
      throw error;
    }

    logger.info('Created application', { applicationId: data[0]?.id });
    return { action: 'created', applicationId: data[0]?.id };
  }

  logger.info('Webhook ignored', { reason: 'No matching application and not a new applicant event' });
  return { action: 'ignored', reason: 'No matching application and not a new applicant event' };
}

function parseWebhookXML(xmlText: string) {
  return {
    eventType: extractXMLTag(xmlText, 'EventType') || 'status_update',
    driverId: extractXMLTag(xmlText, 'DriverId'),
    status: extractXMLTag(xmlText, 'Status'),
    personalData: {
      firstName: extractXMLTag(xmlText, 'GivenName'),
      lastName: extractXMLTag(xmlText, 'FamilyName'),
      email: extractXMLTag(xmlText, 'InternetEmailAddress'),
      phone: extractXMLTag(xmlText, 'PrimaryPhone'),
      city: extractXMLTag(xmlText, 'Municipality'),
      state: extractXMLTag(xmlText, 'Region'),
      zip: extractXMLTag(xmlText, 'PostalCode')
    },
    applicationData: {
      cdl: extractCustomQuestion(xmlText, 'cdl_class'),
      experience: extractCustomQuestion(xmlText, 'experience')
    }
  }
}

function mapPersonalData(personalData: any) {
  if (!personalData) return {}
  
  return {
    first_name: personalData.firstName,
    last_name: personalData.lastName,
    applicant_email: personalData.email,
    phone: personalData.phone,
    city: personalData.city,
    state: personalData.state,
    zip: personalData.zip
  }
}

function mapApplicationData(applicationData: any) {
  if (!applicationData) return {}
  
  return {
    cdl: applicationData.cdl,
    exp: applicationData.experience
  }
}

function mapTenstreetStatus(tenstreetStatus: string): string {
  const statusMap: Record<string, string> = {
    'new': 'pending',
    'in_review': 'reviewing',
    'interview_scheduled': 'interviewing',
    'offer_extended': 'offer',
    'hired': 'hired',
    'rejected': 'rejected',
    'withdrawn': 'withdrawn'
  }
  
  return statusMap[tenstreetStatus?.toLowerCase()] || tenstreetStatus || 'pending'
}

function extractXMLTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'i'))
  return match ? match[1] : null
}

function extractCustomQuestion(xml: string, questionId: string): string | null {
  const questionMatch = xml.match(
    new RegExp(`<CustomQuestion>.*?<QuestionId>${questionId}</QuestionId>.*?<Answer>(.*?)</Answer>.*?</CustomQuestion>`, 'is')
  )
  return questionMatch ? questionMatch[1] : null
}
