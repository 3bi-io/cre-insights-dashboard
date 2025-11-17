/**
 * Tenstreet Sync Edge Function
 * Handles bidirectional sync of applicant data with Tenstreet
 * 
 * SECURITY: Credentials fetched from database, PII redaction enabled
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getServiceClient } from '../_shared/supabase-client.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse, errorResponse, validationErrorResponse } from '../_shared/response.ts';
import { wrapHandler, ValidationError } from '../_shared/error-handler.ts';
import { createLogger, measureTime } from '../_shared/logger.ts';
import { getTenstreetAPIClient } from '../_shared/tenstreet-api-client.ts'
import { 
  buildTenstreetXML, 
  buildPersonalDataXML,
  parseApplicantsFromXML,
  parseApplicantFromXML,
  escapeXML,
  getCompanyId
} from '../_shared/tenstreet-xml-utils.ts'
import { 
  fetchTenstreetCredentials,
  validateCredentials,
  maskCredentialsForLog
} from '../_shared/tenstreet-credentials.ts';
import { sanitizeForLogging, redactApplicationData } from '../_shared/tenstreet-pii-utils.ts';

const logger = createLogger('tenstreet-sync');

const handler = wrapHandler(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(origin) });
  }

  const supabaseClient = getServiceClient();

  const { action, organizationId, companyId, ...params } = await req.json();
  
  logger.info('Tenstreet sync action', { action, organizationId });

  // SECURITY: Fetch credentials from database (no hardcoded credentials)
  const credentials = await measureTime(
    logger,
    'fetch-credentials',
    () => fetchTenstreetCredentials(supabaseClient, {
      organizationId,
      companyId: companyId || params.company_id
    })
  );

  if (!credentials || !validateCredentials(credentials)) {
    logger.warn('Invalid or missing credentials', { organizationId });
    return validationErrorResponse(
      'No valid Tenstreet credentials found. Please configure credentials in settings.',
      origin
    );
  }

  logger.debug('Using credentials', maskCredentialsForLog(credentials));

  // Create API client
  const apiClient = getTenstreetAPIClient();

  switch (action) {
    case 'sync_applicants':
      return await syncApplicantsFromTenstreet(supabaseClient, apiClient, credentials, params, origin);
    
    case 'push_applicant':
      return await pushApplicantToTenstreet(supabaseClient, apiClient, credentials, params, origin);
    
    case 'update_status':
      return await updateApplicantStatus(supabaseClient, apiClient, credentials, params, origin);
    
    case 'search_and_sync':
      return await searchAndSyncApplicant(supabaseClient, apiClient, credentials, params, origin);
      
    default:
      throw new ValidationError(`Unknown action: ${action}`);
  }
}, { context: 'tenstreet-sync', logRequests: true });

async function syncApplicantsFromTenstreet(
  supabaseClient: any,
  apiClient: any,
  credentials: any,
  params: any,
  origin: string | null
) {
  const { dateRange, email, phone, lastName } = params;
  
  logger.info('Searching applicants', sanitizeForLogging({ email, phone, lastName }));

  // Use API client to search
  const response = await measureTime(
    logger,
    'search-applicants-api',
    () => apiClient.searchApplicants(credentials, {
      email,
      phone,
      lastName,
      dateRange: dateRange ? `${dateRange.startDate}/${dateRange.endDate}` : undefined
    })
  );

  if (!response.success) {
    throw new Error(`Tenstreet API error: ${response.data.errors.join(', ')}`);
  }

  // Parse applicants from response
  const applicants = parseApplicantsFromXML(response.responseXml);
  
  logger.info('Applicants found', { count: applicants.length });

  if (applicants.length === 0) {
    return successResponse(
      { synced: 0, message: 'No applicants found' },
      'No applicants found',
      undefined,
      origin
    );
  }

  // Sync each applicant to database
  const syncedApplicants = [];
  for (const applicant of applicants) {
    try {
      if (!applicant.driverId) continue;

      logger.debug('Processing applicant', sanitizeForLogging(applicant));

      // Check if applicant exists
      const { data: existing } = await supabaseClient
        .from('applications')
        .select('id, driver_id')
        .eq('driver_id', applicant.driverId)
        .single();

      const applicantData = {
        first_name: applicant.firstName,
        last_name: applicant.lastName,
        applicant_email: applicant.email,
        phone: applicant.phone,
        city: applicant.city,
        state: applicant.state,
        zip: applicant.zip,
        status: mapTenstreetStatus(applicant.status),
        updated_at: new Date().toISOString()
      };

      if (existing) {
        // Update existing applicant
        const { data, error } = await supabaseClient
          .from('applications')
          .update(applicantData)
          .eq('id', existing.id)
          .select();

        if (!error) {
          syncedApplicants.push({ ...data[0], action: 'updated' });
        } else {
          logger.error('Update error', error);
        }
      } else {
        // Insert new applicant
        const { data, error } = await supabaseClient
          .from('applications')
          .insert({
            ...applicantData,
            driver_id: applicant.driverId,
            source: 'Tenstreet',
            applied_at: applicant.appliedAt || new Date().toISOString()
          })
          .select();

        if (!error) {
          syncedApplicants.push({ ...data[0], action: 'created' });
        } else {
          logger.error('Insert error', error);
        }
      }
    } catch (error) {
      logger.error('Error syncing applicant', error, { driverId: applicant.driverId });
    }
  }

  // Redact PII from response
  const sanitizedResults = syncedApplicants.map(app => redactApplicationData(app));

  logger.info('Sync completed', { synced: syncedApplicants.length });

  return successResponse(
    { synced: syncedApplicants.length, applicants: sanitizedResults },
    `Synced ${syncedApplicants.length} applicants`,
    undefined,
    origin
  );
}

async function pushApplicantToTenstreet(
  supabaseClient: any,
  apiClient: any,
  credentials: any,
  params: any,
  origin: string | null
) {
  const { applicationId } = params;

  logger.info('Pushing applicant to Tenstreet', { applicationId });

  // Get application from database
  const { data: application, error: fetchError } = await supabaseClient
    .from('applications')
    .select('*, job_listings(*)')
    .eq('id', applicationId)
    .single();

  if (fetchError || !application) {
    throw new Error('Application not found');
  }

  logger.debug('Application fetched', { applicationId });

  // Build applicant XML using shared utilities
  const personalDataXml = buildPersonalDataXML({
    firstName: application.first_name,
    lastName: application.last_name,
    middleName: application.middle_name,
    prefix: application.prefix,
    suffix: application.suffix,
    email: application.applicant_email,
    phone: application.phone,
    secondaryPhone: application.secondary_phone,
    address1: application.address_1,
    address2: application.address_2,
    city: application.city,
    state: application.state,
    zip: application.zip,
    country: application.country || 'US',
    dateOfBirth: application.date_of_birth,
    ssn: application.ssn,
    governmentId: application.government_id,
    governmentIdType: application.government_id_type
  });

  const customQuestionsXml = buildCustomQuestionsXML(application);
  const displayFieldsXml = buildDisplayFieldsXML(application);

  const applicationDataXml = customQuestionsXml || displayFieldsXml 
    ? `<ApplicationData>
        ${customQuestionsXml}
        ${displayFieldsXml}
    </ApplicationData>`
    : '';

  const contentXml = `
    <Source>ATS Integration</Source>
    <CompanyName>${escapeXML(credentials.account_name || 'ATS')}</CompanyName>
    ${application.driver_id ? `<DriverId>${escapeXML(application.driver_id)}</DriverId>` : ''}
    ${application.job_listings?.job_id ? `<JobId>${escapeXML(application.job_listings.job_id)}</JobId>` : ''}
    ${personalDataXml}
    ${applicationDataXml}
  `;

  const uploadXML = buildTenstreetXML(credentials, 'subject_upload', contentXml);

  // Make request using API client (with PII redaction in logs)
  const response = await measureTime(
    logger,
    'push-applicant-api',
    () => apiClient.makeRequest(credentials, {
      service: 'subject_upload',
      xmlContent: contentXml
    })
  );

  // Update application with driver_id if successful
  if (response.success && response.data.driverId) {
    await supabaseClient
      .from('applications')
      .update({
        driver_id: response.data.driverId,
        tenstreet_sync_status: 'synced',
        tenstreet_last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    logger.info('Application synced', { 
      applicationId, 
      driverId: response.data.driverId 
    });
  }

  return successResponse(
    {
      driverId: response.data.driverId,
      errors: response.data.errors
    },
    'Application pushed to Tenstreet',
    undefined,
    origin
  );
}

async function updateApplicantStatus(
  supabaseClient: any,
  apiClient: any,
  credentials: any,
  params: any,
  origin: string | null
) {
  const { applicationId, status, statusTag } = params;

  logger.info('Updating applicant status', { applicationId, status });

  // Get application
  const { data: application } = await supabaseClient
    .from('applications')
    .select('driver_id')
    .eq('id', applicationId)
    .single();

  if (!application?.driver_id) {
    throw new Error('Application not found or missing driver_id');
  }

  // Use API client
  const response = await measureTime(
    logger,
    'update-status-api',
    () => apiClient.updateStatus(credentials, application.driver_id, status, statusTag)
  );

  // Update local database
  if (response.success) {
    await supabaseClient
      .from('applications')
      .update({
        status: mapTenstreetStatus(status),
        tenstreet_last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);
    
    logger.info('Status updated', { applicationId, status });
  }

  return successResponse(
    { status, errors: response.data.errors },
    'Status updated',
    undefined,
    origin
  );
}

async function searchAndSyncApplicant(
  supabaseClient: any,
  apiClient: any,
  credentials: any,
  params: any,
  origin: string | null
) {
  const { email, phone, driverId } = params;

  logger.info('Searching applicant', sanitizeForLogging({ email, phone, driverId }));

  let response;
  
  if (driverId) {
    // Get specific applicant
    response = await apiClient.getApplicant(credentials, driverId);
  } else {
    // Search by criteria
    response = await apiClient.searchApplicants(credentials, { email, phone });
  }

  if (!response.success) {
    throw new Error(`Search failed: ${response.data.errors.join(', ')}`);
  }

  const applicants = driverId 
    ? [parseApplicantFromXML(response.responseXml)]
    : parseApplicantsFromXML(response.responseXml);

  logger.info('Search completed', { count: applicants.length });

  return successResponse(
    { applicants: applicants.map(app => sanitizeForLogging(app)) },
    `Found ${applicants.length} applicant(s)`,
    undefined,
    origin
  );
}

// Helper functions
function buildCustomQuestionsXML(application: any): string {
  const questions: string[] = [];

  if (application.cdl) {
    questions.push(`<CustomQuestion>
            <QuestionId>cdl_class</QuestionId>
            <Question>CDL Class</Question>
            <Answer>${escapeXML(application.cdl)}</Answer>
        </CustomQuestion>`);
  }

  if (application.exp) {
    questions.push(`<CustomQuestion>
            <QuestionId>experience</QuestionId>
            <Question>Years of Experience</Question>
            <Answer>${escapeXML(application.exp)}</Answer>
        </CustomQuestion>`);
  }

  if (application.veteran) {
    questions.push(`<CustomQuestion>
            <QuestionId>veteran_status</QuestionId>
            <Question>Veteran Status</Question>
            <Answer>${escapeXML(application.veteran)}</Answer>
        </CustomQuestion>`);
  }

  return questions.length > 0 
    ? `<CustomQuestions>${questions.join('\n')}</CustomQuestions>`
    : '';
}

function buildDisplayFieldsXML(application: any): string {
  const fields: string[] = [];

  if (application.source) {
    fields.push(`<DisplayField>
            <DisplayPrompt>Application Source</DisplayPrompt>
            <DisplayValue>${escapeXML(application.source)}</DisplayValue>
        </DisplayField>`);
  }

  if (application.applied_at) {
    fields.push(`<DisplayField>
            <DisplayPrompt>Applied Date</DisplayPrompt>
            <DisplayValue>${escapeXML(new Date(application.applied_at).toLocaleDateString())}</DisplayValue>
        </DisplayField>`);
  }

  return fields.length > 0
    ? `<DisplayFields>${fields.join('\n')}</DisplayFields>`
    : '';
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
  };
  
  return statusMap[tenstreetStatus?.toLowerCase()] || tenstreetStatus || 'pending';
}

serve(handler);
