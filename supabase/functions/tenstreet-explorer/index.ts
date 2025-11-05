import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { enforceAuth, logSecurityEvent, getClientInfo, createAuthenticatedClient } from '../_shared/serverAuth.ts'
import { 
  validateRequest, 
  validationErrorResponse,
  uuidSchema,
  emailSchema,
  textSchema 
} from '../_shared/securitySchemas.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const ALLOWED_ORIGINS = [
  'https://auwhcdpppldjlcaxzsme.supabase.co',
  'http://localhost:5173',
  'http://localhost:3000'
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

function escapeXML(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Extract company_id from credentials object
 * Handles both array format (company_ids) and singular format (company_id)
 */
function getCompanyId(credentials: any): string {
  // Primary: Extract first company_id from array
  if (credentials.company_ids && Array.isArray(credentials.company_ids) && credentials.company_ids.length > 0) {
    return credentials.company_ids[0].toString();
  }
  
  // Fallback: Use singular field if it exists
  if (credentials.company_id) {
    return credentials.company_id.toString();
  }
  
  // Error: No company_id found
  throw new Error('No company_id found in credentials. Please configure Tenstreet credentials with at least one company ID.');
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // SECURITY: Server-side JWT verification with role check
    const authContext = await enforceAuth(req, ['admin', 'super_admin'])
    if (authContext instanceof Response) return authContext

    const { userId, userRole, organizationId } = authContext
    const { ipAddress, userAgent } = getClientInfo(req)

    // VALIDATION: Parse and validate request body
    const requestSchema = z.object({
      company_id: z.string().min(1, 'company_id is required'),
      action: z.enum([
        'explore_services', 'test_service', 'get_applicant_data',
        'search_applicants', 'get_application_status', 'update_applicant_status',
        'get_available_jobs', 'export_applicants', 'subject_upload', 'subject_update'
      ]),
    }).passthrough()

    const validationResult = requestSchema.safeParse(await req.json())
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error)
    }

    const { company_id, action, ...params } = validationResult.data

    // Create authenticated Supabase client for this user
    const supabaseClient = createAuthenticatedClient(req)

    // AUTHORIZATION: Verify credentials access
    const { data: credentialsList, error: credError } = await supabaseClient
      .from('tenstreet_credentials')
      .select('*')
      .contains('company_ids', [company_id])
      .eq('status', 'active')

    if (credError) {
      throw new Error('Failed to fetch Tenstreet credentials')
    }

    // Super admins can access any credentials, others must match organization
    const credentials = userRole === 'super_admin' 
      ? credentialsList?.[0]
      : credentialsList?.find(cred => cred.organization_id === organizationId)

    if (!credentials) {
      return new Response(
        JSON.stringify({ 
          error: `No Tenstreet credentials found for company ID: ${company_id}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // RATE LIMITING: Check request limits
    const rateCheck = await supabaseClient.rpc('check_rate_limit', {
      _identifier: userId,
      _endpoint: `tenstreet-explorer-${action}`,
      _max_requests: 100,
      _window_minutes: 60
    })

    if (rateCheck.data && !rateCheck.data.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          retry_after: rateCheck.data.retry_after
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // AUDIT LOGGING: Log all sensitive data access
    await logSecurityEvent(supabaseClient, authContext, `TENSTREET_${action.toUpperCase()}`, {
      table: 'tenstreet_api',
      recordId: params.driverId || params.email || params.criteria?.email || 'batch_operation',
      sensitiveFields: ['applicant_data', 'personal_information'],
      ipAddress,
      userAgent
    })

    switch (action) {
      case 'explore_services':
        return await exploreAvailableServices(credentials, corsHeaders)
      
      case 'test_service':
        return await testService(credentials, params.service, params.payload, corsHeaders)
      
      case 'get_applicant_data':
        validateGetApplicantRequest(params);
        return await getApplicantData(credentials, params.driverId, corsHeaders)
      
      case 'search_applicants':
        validateSearchRequest(params);
        return await searchApplicants(credentials, params.criteria, corsHeaders)
      
      case 'get_application_status':
        validateGetApplicantRequest(params);
        return await getApplicationStatus(credentials, params.driverId, corsHeaders)
      
      case 'update_applicant_status':
        validateUpdateStatusRequest(params);
        return await updateApplicantStatus(credentials, params.driverId, params.status, corsHeaders)
      
      case 'get_available_jobs':
        return await getAvailableJobs(credentials, corsHeaders)
      
      case 'export_applicants':
        validateExportRequest(params);
        return await exportApplicants(credentials, params.dateRange, corsHeaders)
      
      case 'subject_upload':
        validateSubjectUploadRequest(params);
        return await createApplicant(credentials, params.applicantData, corsHeaders)
      
      case 'subject_update':
        validateSubjectUpdateRequest(params);
        return await updateApplicant(credentials, params.driverId, params.updates, corsHeaders)
        
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Tenstreet Explorer error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function exploreAvailableServices(credentials: any, corsHeaders: Record<string, string>) {
  
  
  const services = [
    {
      name: 'subject_upload',
      description: 'Upload new applicant data',
      method: 'POST',
      tested: true
    },
    {
      name: 'subject_search',
      description: 'Search for existing applicants',
      method: 'POST',
      tested: false
    },
    {
      name: 'subject_retrieve',
      description: 'Retrieve applicant details by ID',
      method: 'POST',
      tested: false
    },
    {
      name: 'subject_update',
      description: 'Update existing applicant information',
      method: 'POST',
      tested: false
    },
    {
      name: 'status_update',
      description: 'Update applicant status/stage',
      method: 'POST',
      tested: false
    },
    {
      name: 'job_listing',
      description: 'Get available job listings',
      method: 'POST',
      tested: false
    },
    {
      name: 'export_data',
      description: 'Export applicant data',
      method: 'POST',
      tested: false
    },
    {
      name: 'webhook_config',
      description: 'Configure webhooks for applicant updates',
      method: 'POST',
      tested: false
    }
  ]

  return new Response(
    JSON.stringify({
      success: true,
      services,
      endpoint: 'https://dashboard.tenstreet.com/post/',
      authentication: 'XML-based with ClientId and Password',
      note: 'Tenstreet uses SOAP/XML-based API. Contact Tenstreet support for complete API documentation.',
      organization: credentials.account_name,
      mode: credentials.mode,
      companyId: getCompanyId(credentials)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function testService(credentials: any, serviceName: string, customPayload?: any, corsHeaders?: Record<string, string>) {
  const testXML = buildServiceTestXML(credentials, serviceName, customPayload)
  
  console.log(`Testing service: ${serviceName}`)
  console.log('XML Payload:', testXML)

  try {
    const response = await fetch('https://dashboard.tenstreet.com/post/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: testXML
    })

    const responseText = await response.text()
    console.log('Tenstreet response:', responseText)

    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        service: serviceName,
        request: testXML,
        response: responseText,
        parsed: parseXMLResponse(responseText)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        service: serviceName
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function getApplicantData(credentials: any, driverId: string, corsHeaders?: Record<string, string>) {
  const retrieveXML = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<TenstreetData>
    <Authentication>
        <ClientId>${escapeXML(credentials.client_id)}</ClientId>
        <Password>${escapeXML(credentials.password)}</Password>
        <Service>subject_retrieve</Service>
    </Authentication>
    <Mode>${escapeXML(credentials.mode)}</Mode>
    <CompanyId>${escapeXML(getCompanyId(credentials))}</CompanyId>
    <DriverId>${escapeXML(driverId)}</DriverId>
</TenstreetData>`

  return await makeRequest(retrieveXML, 'Get Applicant Data', corsHeaders)
}

async function searchApplicants(credentials: any, criteria: any, corsHeaders?: Record<string, string>) {
  const { email, phone, lastName, dateRange } = criteria
  
  const searchXML = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<TenstreetData>
    <Authentication>
        <ClientId>${escapeXML(credentials.client_id)}</ClientId>
        <Password>${escapeXML(credentials.password)}</Password>
        <Service>subject_search</Service>
    </Authentication>
    <Mode>${escapeXML(credentials.mode)}</Mode>
    <CompanyId>${escapeXML(getCompanyId(credentials))}</CompanyId>
    <SearchCriteria>
        ${email ? `<Email>${escapeXML(email)}</Email>` : ''}
        ${phone ? `<Phone>${escapeXML(phone)}</Phone>` : ''}
        ${lastName ? `<LastName>${escapeXML(lastName)}</LastName>` : ''}
        ${dateRange ? `<DateRange>${escapeXML(dateRange)}</DateRange>` : ''}
    </SearchCriteria>
</TenstreetData>`

  return await makeRequest(searchXML, 'Search Applicants', corsHeaders)
}

async function getApplicationStatus(credentials: any, driverId: string, corsHeaders?: Record<string, string>) {
  const statusXML = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<TenstreetData>
    <Authentication>
        <ClientId>${credentials.client_id}</ClientId>
        <Password>${credentials.password}</Password>
        <Service>status_retrieve</Service>
    </Authentication>
    <Mode>${credentials.mode}</Mode>
    <CompanyId>${getCompanyId(credentials)}</CompanyId>
    <DriverId>${driverId}</DriverId>
</TenstreetData>`

  return await makeRequest(statusXML, 'Get Application Status', corsHeaders)
}

async function updateApplicantStatus(credentials: any, driverId: string, status: string, corsHeaders?: Record<string, string>) {
  const updateXML = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<TenstreetData>
    <Authentication>
        <ClientId>${escapeXML(credentials.client_id)}</ClientId>
        <Password>${escapeXML(credentials.password)}</Password>
        <Service>status_update</Service>
    </Authentication>
    <Mode>${escapeXML(credentials.mode)}</Mode>
    <CompanyId>${escapeXML(getCompanyId(credentials))}</CompanyId>
    <DriverId>${escapeXML(driverId)}</DriverId>
    <Status>${escapeXML(status)}</Status>
</TenstreetData>`

  return await makeRequest(updateXML, 'Update Applicant Status', corsHeaders)
}

async function getAvailableJobs(credentials: any, corsHeaders?: Record<string, string>) {
  const jobsXML = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<TenstreetData>
    <Authentication>
        <ClientId>${credentials.client_id}</ClientId>
        <Password>${credentials.password}</Password>
        <Service>job_listing</Service>
    </Authentication>
    <Mode>${credentials.mode}</Mode>
    <CompanyId>${getCompanyId(credentials)}</CompanyId>
</TenstreetData>`

  return await makeRequest(jobsXML, 'Get Available Jobs', corsHeaders)
}

async function exportApplicants(credentials: any, dateRange: any, corsHeaders?: Record<string, string>) {
  const { startDate, endDate } = dateRange
  
  const exportXML = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<TenstreetData>
    <Authentication>
        <ClientId>${escapeXML(credentials.client_id)}</ClientId>
        <Password>${escapeXML(credentials.password)}</Password>
        <Service>export_data</Service>
    </Authentication>
    <Mode>${escapeXML(credentials.mode)}</Mode>
    <CompanyId>${escapeXML(getCompanyId(credentials))}</CompanyId>
    <ExportCriteria>
        <StartDate>${escapeXML(startDate)}</StartDate>
        <EndDate>${escapeXML(endDate)}</EndDate>
    </ExportCriteria>
</TenstreetData>`

  return await makeRequest(exportXML, 'Export Applicants', corsHeaders)
}

async function makeRequest(xmlPayload: string, actionName: string, corsHeaders?: Record<string, string>, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`${actionName} - Attempt ${attempt}/${maxRetries} - XML Request:`, xmlPayload)
      
      // Add timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch('https://dashboard.tenstreet.com/post/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
        },
        body: xmlPayload,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      console.log(`${actionName} - Response (${response.status}):`, responseText);

      return new Response(
        JSON.stringify({
          success: response.ok,
          status: response.status,
          response: responseText,
          parsed: parseXMLResponse(responseText),
          action: actionName,
          attempt
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error(`${actionName} - Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message,
            action: actionName,
            attempts: maxRetries
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }
}

// Validation functions
function validateGetApplicantRequest(params: any) {
  if (!params.driverId || typeof params.driverId !== 'string') {
    throw new Error('driverId is required and must be a string');
  }
}

function validateSearchRequest(params: any) {
  if (!params.criteria || typeof params.criteria !== 'object') {
    throw new Error('criteria is required and must be an object');
  }
}

function validateUpdateStatusRequest(params: any) {
  if (!params.driverId || !params.status) {
    throw new Error('driverId and status are required');
  }
}

function validateExportRequest(params: any) {
  if (!params.dateRange || !params.dateRange.startDate || !params.dateRange.endDate) {
    throw new Error('dateRange with startDate and endDate is required');
  }
}

function validateSubjectUploadRequest(params: any) {
  if (!params.applicantData || typeof params.applicantData !== 'object') {
    throw new Error('applicantData is required and must be an object');
  }
}

function validateSubjectUpdateRequest(params: any) {
  if (!params.driverId || !params.updates) {
    throw new Error('driverId and updates are required');
  }
}

function parseXMLResponse(xml: string): any {
  try {
    // Basic XML parsing - extract key information
    const errors = xml.match(/<Error>(.*?)<\/Error>/gi);
    const success = xml.match(/<Success>(.*?)<\/Success>/i);
    const driverIds = xml.match(/<DriverId>(.*?)<\/DriverId>/gi);
    
    return {
      hasErrors: !!errors,
      errors: errors?.map(e => e.replace(/<\/?Error>/gi, '')) || [],
      success: success?.[1] || null,
      driverIds: driverIds?.map(d => d.replace(/<\/?DriverId>/gi, '')) || [],
      rawXml: xml
    };
  } catch (error) {
    return { parseError: error.message, rawXml: xml };
  }
}

function buildServiceTestXML(credentials: any, serviceName: string, customPayload?: any): string {
  const baseXML = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<TenstreetData>
    <Authentication>
        <ClientId>${escapeXML(credentials.client_id)}</ClientId>
        <Password>${escapeXML(credentials.password)}</Password>
        <Service>${escapeXML(serviceName)}</Service>
    </Authentication>
    <Mode>${escapeXML(credentials.mode)}</Mode>
    <CompanyId>${escapeXML(getCompanyId(credentials))}</CompanyId>
    ${customPayload ? buildCustomPayload(customPayload) : ''}
</TenstreetData>`;

  return baseXML;
}

function buildCustomPayload(payload: any): string {
  if (typeof payload === 'string') return payload;
  
  // Convert object to XML
  return Object.entries(payload)
    .map(([key, value]) => `<${key}>${escapeXML(String(value))}</${key}>`)
    .join('\n    ');
}

async function createApplicant(credentials: any, applicantData: any, corsHeaders?: Record<string, string>) {
  const uploadXML = buildSubjectUploadXML(credentials, applicantData);
  return await makeRequest(uploadXML, 'Create Applicant', corsHeaders);
}

async function updateApplicant(credentials: any, driverId: string, updates: any, corsHeaders?: Record<string, string>) {
  const updateXML = buildSubjectUpdateXML(credentials, driverId, updates);
  return await makeRequest(updateXML, 'Update Applicant', corsHeaders);
}

function buildSubjectUploadXML(credentials: any, data: any): string {
  return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<TenstreetData>
    <Authentication>
        <ClientId>${escapeXML(credentials.client_id)}</ClientId>
        <Password>${escapeXML(credentials.password)}</Password>
        <Service>subject_upload</Service>
    </Authentication>
    <Mode>${escapeXML(credentials.mode)}</Mode>
    <CompanyId>${escapeXML(getCompanyId(credentials))}</CompanyId>
    <ApplicantData>
        ${data.firstName ? `<FirstName>${escapeXML(data.firstName)}</FirstName>` : ''}
        ${data.lastName ? `<LastName>${escapeXML(data.lastName)}</LastName>` : ''}
        ${data.email ? `<Email>${escapeXML(data.email)}</Email>` : ''}
        ${data.phone ? `<Phone>${escapeXML(data.phone)}</Phone>` : ''}
    </ApplicantData>
</TenstreetData>`;
}

function buildSubjectUpdateXML(credentials: any, driverId: string, updates: any): string {
  return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<TenstreetData>
    <Authentication>
        <ClientId>${escapeXML(credentials.client_id)}</ClientId>
        <Password>${escapeXML(credentials.password)}</Password>
        <Service>subject_update</Service>
    </Authentication>
    <Mode>${escapeXML(credentials.mode)}</Mode>
    <CompanyId>${escapeXML(getCompanyId(credentials))}</CompanyId>
    <DriverId>${escapeXML(driverId)}</DriverId>
    <Updates>
        ${Object.entries(updates).map(([key, value]) => 
          `<${key}>${escapeXML(String(value))}</${key}>`
        ).join('\n        ')}
    </Updates>
</TenstreetData>`;
}
