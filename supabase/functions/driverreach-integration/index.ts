import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse, errorResponse, validationErrorResponse } from '../_shared/response.ts';
import { createLogger } from '../_shared/logger.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';

const logger = createLogger('driverreach-integration');

// Validation schemas
const driverreachActionSchema = z.enum(['send_application', 'test_connection', 'sync_applicant']);

const driverreachConfigSchema = z.object({
  apiKey: z.string().min(1, 'API Key is required'),
  companyId: z.string().min(1, 'Company ID is required'),
  apiEndpoint: z.string().optional(),
  mode: z.enum(['PROD', 'TEST', 'DEV']).optional(),
  source: z.string().optional(),
  companyName: z.string().optional(),
});

const driverreachRequestSchema = z.object({
  action: driverreachActionSchema,
  config: driverreachConfigSchema.optional(),
  applicationData: z.record(z.any()).optional(),
  mappings: z.record(z.any()).optional(),
});

/**
 * Build DriverReach JSON payload for application submission
 * DriverReach uses a REST API with JSON payloads (unlike Tenstreet's XML)
 */
function buildDriverReachPayload(
  applicationData: Record<string, unknown>,
  fieldMappings: Record<string, unknown>,
  config: Record<string, string>
): Record<string, unknown> {
  const personalData = (fieldMappings?.personalData || {}) as Record<string, string>;
  
  const getFieldValue = (data: Record<string, unknown>, field: string): string => {
    if (!field) return '';
    const value = data[field];
    return value !== null && value !== undefined ? String(value) : '';
  };
  
  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `${digits.substring(0, 3)}-${digits.substring(3, 6)}-${digits.substring(6)}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return `${digits.substring(1, 4)}-${digits.substring(4, 7)}-${digits.substring(7)}`;
    }
    return phone;
  };

  // Build the DriverReach application payload
  const payload = {
    source: config.source || '3BI',
    company_id: config.companyId,
    external_id: applicationData.id || '',
    
    // Applicant Information
    applicant: {
      first_name: getFieldValue(applicationData, personalData?.givenName || 'first_name'),
      middle_name: getFieldValue(applicationData, personalData?.middleName || 'middle_name'),
      last_name: getFieldValue(applicationData, personalData?.familyName || 'last_name'),
      email: getFieldValue(applicationData, personalData?.internetEmailAddress || 'applicant_email'),
      phone: formatPhoneNumber(getFieldValue(applicationData, personalData?.primaryPhone || 'phone')),
      secondary_phone: formatPhoneNumber(getFieldValue(applicationData, personalData?.secondaryPhone || 'secondary_phone')),
      date_of_birth: getFieldValue(applicationData, personalData?.dateOfBirth || 'date_of_birth'),
    },
    
    // Address
    address: {
      street1: getFieldValue(applicationData, personalData?.address1 || 'address_1'),
      street2: getFieldValue(applicationData, personalData?.address2 || 'address_2'),
      city: getFieldValue(applicationData, personalData?.municipality || 'city'),
      state: getFieldValue(applicationData, personalData?.region || 'state'),
      zip: getFieldValue(applicationData, personalData?.postalCode || 'zip'),
      country: 'US',
    },
    
    // CDL Information
    cdl: {
      has_cdl: getFieldValue(applicationData, 'cdl') === 'Yes',
      cdl_class: getFieldValue(applicationData, 'cdl_class'),
      cdl_state: getFieldValue(applicationData, 'cdl_state'),
      endorsements: applicationData.cdl_endorsements || [],
      expiration_date: getFieldValue(applicationData, 'cdl_expiration_date'),
    },
    
    // Experience
    experience: {
      years: applicationData.driving_experience_years || null,
      description: getFieldValue(applicationData, 'exp'),
    },
    
    // Additional Fields
    employment_history: applicationData.employment_history || [],
    veteran: getFieldValue(applicationData, 'veteran') === 'Yes',
    over_21: getFieldValue(applicationData, 'over_21') === 'Yes',
    can_pass_drug_test: getFieldValue(applicationData, 'can_pass_drug_test') === 'Yes',
    
    // Custom fields from display fields mapping
    custom_fields: {} as Record<string, string>,
    
    // Metadata
    metadata: {
      submitted_at: new Date().toISOString(),
      source_system: '3BI',
      job_id: applicationData.job_id || null,
      referral_source: applicationData.referral_source || null,
    },
  };

  // Add custom questions as custom fields
  const customQuestions = fieldMappings?.customQuestions as Array<{ mapping: string; questionId: string }> | undefined;
  if (customQuestions && Array.isArray(customQuestions)) {
    customQuestions.forEach((q) => {
      if (q.mapping && q.questionId) {
        const value = getFieldValue(applicationData, q.mapping);
        if (value) {
          payload.custom_fields[q.questionId] = value;
        }
      }
    });
  }

  return payload;
}

/**
 * Handle test connection to DriverReach API
 */
async function handleTestConnection(
  config: Record<string, string>,
  corsHeaders: Record<string, string>,
  origin: string | null
) {
  const TIMEOUT_MS = 10000;
  
  if (!config?.apiKey || !config?.companyId) {
    return validationErrorResponse('Missing required configuration: apiKey or companyId', origin || undefined);
  }

  logger.info('Testing DriverReach connection', { company_id: config.companyId });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    const endpoint = config.apiEndpoint || 'https://api.driverreach.com/v1';
    const startTime = Date.now();
    
    // Test connection by fetching company info
    const response = await fetch(`${endpoint}/companies/${config.companyId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    // DriverReach returns 200 for valid credentials
    const isSuccess = response.ok || response.status === 401; // 401 means API is reachable but key invalid
    
    let responseData;
    try {
      responseData = await response.json();
    } catch {
      responseData = { message: await response.text() };
    }

    logger.info('DriverReach test response', { 
      status: response.status, 
      success: response.ok, 
      duration_ms: duration 
    });

    if (response.ok) {
      return successResponse(
        { success: true, status: response.status, response: responseData },
        'Connection successful',
        { duration_ms: duration },
        origin || undefined
      );
    } else {
      return successResponse(
        { success: false, status: response.status, response: responseData },
        'Connection failed - check your API key',
        { duration_ms: duration },
        origin || undefined
      );
    }
  } catch (error) {
    const err = error as Error;
    const isTimeout = err.name === 'AbortError';
    
    logger.error('Connection test failed', err, { isTimeout });
    
    const message = isTimeout 
      ? 'Connection timeout - DriverReach API did not respond within 10 seconds'
      : err.message;
      
    return errorResponse(message, 500, undefined, origin || undefined);
  }
}

/**
 * Handle sending application to DriverReach
 */
async function handleSendApplication(
  data: Record<string, unknown>,
  corsHeaders: Record<string, string>,
  origin: string | null
) {
  const { config, applicationData, mappings } = data as {
    config: Record<string, string>;
    applicationData: Record<string, unknown>;
    mappings: Record<string, unknown>;
  };

  if (!config?.apiKey || !config?.companyId) {
    return validationErrorResponse('Missing required configuration', origin || undefined);
  }

  if (!applicationData) {
    return validationErrorResponse('Missing application data', origin || undefined);
  }

  logger.info('Sending application to DriverReach', { 
    application_id: applicationData.id,
    company_id: config.companyId 
  });

  try {
    const payload = buildDriverReachPayload(applicationData, mappings || {}, config);
    const endpoint = config.apiEndpoint || 'https://api.driverreach.com/v1';
    
    const startTime = Date.now();
    const response = await fetch(`${endpoint}/applicants`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const duration = Date.now() - startTime;
    let responseData;
    try {
      responseData = await response.json();
    } catch {
      responseData = { message: await response.text() };
    }

    logger.info('DriverReach send response', { 
      status: response.status, 
      success: response.ok, 
      duration_ms: duration,
      application_id: applicationData.id 
    });

    if (response.ok) {
      return successResponse(
        { 
          success: true, 
          status: response.status, 
          driverreach_id: responseData?.id,
          response: responseData 
        },
        'Application sent to DriverReach successfully',
        { duration_ms: duration },
        origin || undefined
      );
    } else {
      return errorResponse(
        `Failed to send application: ${responseData?.message || response.statusText}`,
        response.status,
        { response: responseData },
        origin || undefined
      );
    }
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to send application to DriverReach', err);
    return errorResponse(err.message, 500, undefined, origin || undefined);
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return errorResponse('Unauthorized', 401, undefined, origin || undefined);
    }

    // Parse and validate request
    const body = await req.json();
    const validationResult = driverreachRequestSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn('Invalid request', { errors: validationResult.error.errors });
      return validationErrorResponse(
        validationResult.error.errors.map(e => e.message).join(', '),
        origin || undefined
      );
    }

    const { action, config, applicationData, mappings } = validationResult.data;

    logger.info('Processing DriverReach request', { action });

    switch (action) {
      case 'test_connection':
        return await handleTestConnection(
          config as Record<string, string>,
          corsHeaders,
          origin
        );

      case 'send_application':
        return await handleSendApplication(
          { config, applicationData, mappings },
          corsHeaders,
          origin
        );

      case 'sync_applicant':
        // Future: Implement applicant sync from DriverReach
        return successResponse(
          { message: 'Sync not yet implemented' },
          'Sync feature coming soon',
          undefined,
          origin || undefined
        );

      default:
        return validationErrorResponse(`Unknown action: ${action}`, origin || undefined);
    }
  } catch (error) {
    const err = error as Error;
    logger.error('Error processing DriverReach request', err);
    return errorResponse('Internal server error', 500, { details: err.message }, origin || undefined);
  }
});
