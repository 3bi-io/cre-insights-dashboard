/**
 * Tenstreet Sync Edge Function
 * Handles bidirectional sync of applicant data with Tenstreet
 * 
 * SECURITY: Credentials fetched from database, PII redaction enabled
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getServiceClient } from '../_shared/supabase-client.ts'
import { getCorsHeaders } from '../_shared/cors-config.ts'
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
} from '../_shared/tenstreet-credentials.ts'
import { sanitizeForLogging, redactApplicationData } from '../_shared/tenstreet-pii-utils.ts'
import { createLogger } from '../_shared/logger.ts'

const logger = createLogger('tenstreet-sync');
const corsHeaders = getCorsHeaders();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, organizationId, companyId, ...params } = await req.json()
    
    logger.info('Action received', { action })

    // SECURITY: Fetch credentials from database (no hardcoded credentials)
    const credentials = await fetchTenstreetCredentials(supabaseClient, {
      organizationId,
      companyId: companyId || params.company_id
    });

    if (!credentials || !validateCredentials(credentials)) {
      return new Response(
        JSON.stringify({ 
          error: 'No valid Tenstreet credentials found. Please configure credentials in settings.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    logger.info('Using credentials', { masked: maskCredentialsForLog(credentials) });

    // Create API client
    const apiClient = getTenstreetAPIClient();

    switch (action) {
      case 'sync_applicants':
        return await syncApplicantsFromTenstreet(supabaseClient, apiClient, credentials, params, corsHeaders)
      
      case 'push_applicant':
        return await pushApplicantToTenstreet(supabaseClient, apiClient, credentials, params, corsHeaders)
      
      case 'update_status':
        return await updateApplicantStatus(supabaseClient, apiClient, credentials, params, corsHeaders)
      
      case 'search_and_sync':
        return await searchAndSyncApplicant(supabaseClient, apiClient, credentials, params, corsHeaders)
        
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    logger.error('Error', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function syncApplicantsFromTenstreet(
  supabaseClient: any,
  apiClient: any,
  credentials: any,
  params: any,
  corsHeaders: any
) {
  const { dateRange, email, phone, lastName } = params
  
  logger.info('Searching applicants', { criteria: sanitizeForLogging({ email, phone, lastName }) });

  // Use API client to search
  const response = await apiClient.searchApplicants(credentials, {
    email,
    phone,
    lastName,
    dateRange: dateRange ? `${dateRange.startDate}/${dateRange.endDate}` : undefined
  });

  if (!response.success) {
    throw new Error(`Tenstreet API error: ${response.data.errors.join(', ')}`);
  }

  // Parse applicants from response
  const applicants = parseApplicantsFromXML(response.responseXml);
  
  logger.info('Found applicants', { count: applicants.length });

  if (applicants.length === 0) {
    return new Response(
      JSON.stringify({
        success: true,
        message: 'No applicants found',
        synced: 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Sync each applicant to database
  const syncedApplicants = []
  for (const applicant of applicants) {
    try {
      if (!applicant.driverId) continue;

      logger.debug('Processing applicant', { applicant: sanitizeForLogging(applicant) });

      // Check if applicant exists
      const { data: existing } = await supabaseClient
        .from('applications')
        .select('id, driver_id')
        .eq('driver_id', applicant.driverId)
        .single()

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
          .select()

        if (!error) {
          syncedApplicants.push({ ...data[0], action: 'updated' })
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
          .select()

        if (!error) {
          syncedApplicants.push({ ...data[0], action: 'created' })
        } else {
          logger.error('Insert error', error);
        }
      }
    } catch (error) {
      logger.error('Error syncing applicant', error, { driverId: applicant.driverId })
    }
  }

  // Redact PII from response
  const sanitizedResults = syncedApplicants.map(app => redactApplicationData(app));

  return new Response(
    JSON.stringify({
      success: true,
      synced: syncedApplicants.length,
      applicants: sanitizedResults
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function pushApplicantToTenstreet(
  supabaseClient: any,
  apiClient: any,
  credentials: any,
  params: any,
  corsHeaders: any
) {
  const { applicationId } = params

  // Get application from database
  const { data: application, error: fetchError } = await supabaseClient
    .from('applications')
    .select('*, job_listings(*)')
    .eq('id', applicationId)
    .single()

  if (fetchError || !application) {
    throw new Error('Application not found')
  }

  logger.info('Pushing application', { applicationId });

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
  const response = await apiClient.makeRequest(credentials, {
    service: 'subject_upload',
    xmlContent: contentXml
  });

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
      .eq('id', applicationId)

    logger.info('Application synced', { driverId: response.data.driverId });
  }

  return new Response(
    JSON.stringify({
      success: response.success,
      driverId: response.data.driverId,
      errors: response.data.errors
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateApplicantStatus(
  supabaseClient: any,
  apiClient: any,
  credentials: any,
  params: any,
  corsHeaders: any
) {
  const { applicationId, status, statusTag } = params

  // Get application
  const { data: application } = await supabaseClient
    .from('applications')
    .select('driver_id')
    .eq('id', applicationId)
    .single()

  if (!application?.driver_id) {
    throw new Error('Application not found or missing driver_id')
  }

  logger.info('Updating status', { driverId: application.driver_id, status });

  // Use API client
  const response = await apiClient.updateStatus(
    credentials,
    application.driver_id,
    status,
    statusTag
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
      .eq('id', applicationId)
  }

  return new Response(
    JSON.stringify({
      success: response.success,
      status,
      errors: response.data.errors
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function searchAndSyncApplicant(
  supabaseClient: any,
  apiClient: any,
  credentials: any,
  params: any,
  corsHeaders: any
) {
  const { email, phone, driverId } = params

  logger.info('Search criteria', { criteria: sanitizeForLogging({ email, phone, driverId }) });

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

  return new Response(
    JSON.stringify({
      success: true,
      applicants: applicants.map(app => sanitizeForLogging(app))
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
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
