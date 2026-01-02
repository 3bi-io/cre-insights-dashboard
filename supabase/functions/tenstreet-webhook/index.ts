import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { createLogger } from '../_shared/logger.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { wrapHandler } from '../_shared/error-handler.ts';

const logger = createLogger('tenstreet-webhook');

// Webhook event types
const WEBHOOK_EVENTS = ['new_applicant', 'applicant_created', 'status_update', 'profile_update'] as const;

const handler = wrapHandler(async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getServiceClient();

  // Parse incoming Tenstreet webhook
  const contentType = req.headers.get('content-type') || '';
  
  let webhookData;
  if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
    const xmlText = await req.text();
    logger.info('Received Tenstreet webhook', { format: 'XML', length: xmlText.length });
    webhookData = parseWebhookXML(xmlText);
  } else {
    webhookData = await req.json();
    logger.info('Received Tenstreet webhook', { format: 'JSON' });
  }

  // Process webhook based on event type
  const result = await processWebhook(supabase, webhookData);

  return successResponse(
    { processed: result },
    'Webhook processed successfully',
    undefined,
    origin || undefined
  );
}, { context: 'TenstreetWebhook', logRequests: true });

Deno.serve(handler);

// Process webhook data
async function processWebhook(supabase: ReturnType<typeof getServiceClient>, webhookData: WebhookData) {
  const { eventType, driverId, status, personalData, applicationData } = webhookData;

  logger.info('Processing webhook', { eventType, driverId, status });

  // Find existing application by driver_id
  const { data: existingApp } = await supabase
    .from('applications')
    .select('id')
    .eq('driver_id', driverId)
    .single();

  if (existingApp) {
    // Update existing application
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = mapTenstreetStatus(status);
    }

    if (personalData) {
      Object.assign(updateData, mapPersonalData(personalData));
    }

    const { data, error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', existingApp.id)
      .select();

    if (error) {
      logger.error('Error updating application', error);
      throw error;
    }

    logger.info('Updated application', { id: data?.[0]?.id });
    return { action: 'updated', applicationId: data?.[0]?.id };

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

    const { data, error } = await supabase
      .from('applications')
      .insert(insertData)
      .select();

    if (error) {
      logger.error('Error creating application', error);
      throw error;
    }

    logger.info('Created application', { id: data?.[0]?.id });
    return { action: 'created', applicationId: data?.[0]?.id };
  }

  return { action: 'ignored', reason: 'No matching application and not a new applicant event' };
}

// Type definitions
interface WebhookData {
  eventType: string;
  driverId: string;
  status: string;
  personalData?: PersonalData;
  applicationData?: ApplicationData;
}

interface PersonalData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface ApplicationData {
  cdl?: string;
  experience?: string;
}

// Parse XML webhook data
function parseWebhookXML(xmlText: string): WebhookData {
  return {
    eventType: extractXMLTag(xmlText, 'EventType') || 'status_update',
    driverId: extractXMLTag(xmlText, 'DriverId') || '',
    status: extractXMLTag(xmlText, 'Status') || '',
    personalData: {
      firstName: extractXMLTag(xmlText, 'GivenName') || undefined,
      lastName: extractXMLTag(xmlText, 'FamilyName') || undefined,
      email: extractXMLTag(xmlText, 'InternetEmailAddress') || undefined,
      phone: extractXMLTag(xmlText, 'PrimaryPhone') || undefined,
      city: extractXMLTag(xmlText, 'Municipality') || undefined,
      state: extractXMLTag(xmlText, 'Region') || undefined,
      zip: extractXMLTag(xmlText, 'PostalCode') || undefined
    },
    applicationData: {
      cdl: extractCustomQuestion(xmlText, 'cdl_class') || undefined,
      experience: extractCustomQuestion(xmlText, 'experience') || undefined
    }
  };
}

function mapPersonalData(personalData?: PersonalData): Record<string, unknown> {
  if (!personalData) return {};
  
  return {
    first_name: personalData.firstName,
    last_name: personalData.lastName,
    applicant_email: personalData.email,
    phone: personalData.phone,
    city: personalData.city,
    state: personalData.state,
    zip: personalData.zip
  };
}

function mapApplicationData(applicationData?: ApplicationData): Record<string, unknown> {
  if (!applicationData) return {};
  
  return {
    cdl: applicationData.cdl,
    exp: applicationData.experience
  };
}

function mapTenstreetStatus(tenstreetStatus?: string): string {
  if (!tenstreetStatus) return 'pending';
  
  const statusMap: Record<string, string> = {
    'new': 'pending',
    'in_review': 'reviewing',
    'interview_scheduled': 'interviewing',
    'offer_extended': 'offer',
    'hired': 'hired',
    'rejected': 'rejected',
    'withdrawn': 'withdrawn'
  };
  
  return statusMap[tenstreetStatus.toLowerCase()] || tenstreetStatus;
}

function extractXMLTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>(.*?)<\\/${tag}>`, 'i'));
  return match ? match[1] : null;
}

function extractCustomQuestion(xml: string, questionId: string): string | null {
  const questionMatch = xml.match(
    new RegExp(`<CustomQuestion>.*?<QuestionId>${questionId}</QuestionId>.*?<Answer>(.*?)</Answer>.*?</CustomQuestion>`, 'is')
  );
  return questionMatch ? questionMatch[1] : null;
}
