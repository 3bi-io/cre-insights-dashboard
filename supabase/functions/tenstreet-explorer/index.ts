// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
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
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError) {
      console.error('Auth error:', userError)
      throw new Error(`Authentication failed: ${userError.message}`)
    }
    
    if (!user) {
      console.error('No user found in session')
      throw new Error('No authenticated user found')
    }
    
    console.log('Authenticated user:', user.id, user.email)

    // Check if user is super admin
    const { data: isSuperAdmin } = await supabaseClient.rpc('is_super_admin', {
      _user_id: user.id
    })

    // Get user's organization
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    let targetOrgId = profile?.organization_id

    // Parse request body
    const requestBody = await req.json()
    const { company_id, action, ...params } = requestBody
    
    // Require company_id parameter
    if (!company_id) {
      return new Response(
        JSON.stringify({ error: 'company_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Super admins can access any company's credentials
    if (isSuperAdmin) {
      console.log('Super admin access - querying by company_id:', company_id)
    } else {
      // Non-super-admins need an organization
      if (!targetOrgId) {
        throw new Error('No organization found for user')
      }

      // Check if organization has ATS Explorer access
      const { data: hasAccess, error: accessError } = await supabaseClient.rpc('get_user_platform_access', {
        _platform_name: 'ats_explorer'
      })

      if (accessError) {
        console.error('Error checking platform access:', accessError)
        throw new Error('Failed to verify platform access')
      }

      if (!hasAccess) {
        return new Response(
          JSON.stringify({ 
            error: 'ATS Explorer access is not enabled for your organization. Please contact your administrator.' 
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Fetch Tenstreet credentials by company_id
    const { data: credentialsList, error: credError } = await supabaseClient
      .from('tenstreet_credentials')
      .select('*')
      .contains('company_ids', [company_id])
      .eq('status', 'active')

    if (credError) {
      console.error('Error fetching credentials:', credError)
      throw new Error('Failed to fetch Tenstreet credentials')
    }

    // For non-super-admins, verify the credentials belong to their organization
    let credentials = null
    if (!isSuperAdmin) {
      credentials = credentialsList?.find(cred => cred.organization_id === targetOrgId)
    } else {
      credentials = credentialsList?.[0]
    }

    if (!credentials) {
      return new Response(
        JSON.stringify({ 
          error: `No Tenstreet credentials found for company ID: ${company_id}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Using credentials for company_id:', company_id)
    console.log('Mode:', credentials.mode)
    
    console.log(`Tenstreet Explorer: ${action}`)

    // Rate limiting check
    const rateCheck = await supabaseClient.rpc('check_rate_limit', {
      _identifier: user.id,
      _endpoint: `tenstreet-explorer-${action}`,
      _max_requests: 100,
      _window_minutes: 60
    });

    if (rateCheck.data && !rateCheck.data.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          retry_after: rateCheck.data.retry_after
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Audit logging for all actions
    const auditPayload = {
      user_id: user.id,
      organization_id: targetOrgId,
      table_name: 'tenstreet_api',
      record_id: params.driverId || params.email || params.criteria?.email || 'batch_operation',
      action: `TENSTREET_${action.toUpperCase()}`,
      sensitive_fields: ['applicant_data', 'personal_information'],
      metadata: {
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent'),
        company_id: company_id,
        action_params: Object.keys(params)
      }
    };

    await supabaseClient.from('audit_logs').insert(auditPayload).then(
      ({ error: auditError }) => {
        if (auditError) console.error('Audit log error:', auditError);
      }
    );

    switch (action) {
      case 'explore_services':
        return await exploreAvailableServices(credentials)
      
      case 'test_service':
        return await testService(credentials, params.service, params.payload)
      
      case 'get_applicant_data':
        validateGetApplicantRequest(params);
        return await getApplicantData(credentials, params.driverId)
      
      case 'search_applicants':
        validateSearchRequest(params);
        return await searchApplicants(credentials, params.criteria)
      
      case 'get_application_status':
        validateGetApplicantRequest(params);
        return await getApplicationStatus(credentials, params.driverId)
      
      case 'update_applicant_status':
        validateUpdateStatusRequest(params);
        return await updateApplicantStatus(credentials, params.driverId, params.status)
      
      case 'get_available_jobs':
        return await getAvailableJobs(credentials)
      
      case 'export_applicants':
        validateExportRequest(params);
        return await exportApplicants(credentials, params.dateRange)
      
      case 'subject_upload':
        validateSubjectUploadRequest(params);
        return await createApplicant(credentials, params.applicantData)
      
      case 'subject_update':
        validateSubjectUpdateRequest(params);
        return await updateApplicant(credentials, params.driverId, params.updates)
        
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

async function exploreAvailableServices(credentials: any) {
  // Known Tenstreet services based on documentation
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
      companyId: credentials.company_id
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function testService(credentials: any, serviceName: string, customPayload?: any) {
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

async function getApplicantData(credentials: any, driverId: string) {
  const retrieveXML = `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${escapeXML(credentials.client_id)}</ClientId>
        <Password>${escapeXML(credentials.password)}</Password>
        <Service>subject_retrieve</Service>
    </Authentication>
    <Mode>${escapeXML(credentials.mode)}</Mode>
    <CompanyId>${escapeXML(credentials.company_id)}</CompanyId>
    <DriverId>${escapeXML(driverId)}</DriverId>
</TenstreetData>`

  return await makeRequest(retrieveXML, 'Get Applicant Data')
}

async function searchApplicants(credentials: any, criteria: any) {
  const { email, phone, lastName, dateRange } = criteria
  
  const searchXML = `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${escapeXML(credentials.client_id)}</ClientId>
        <Password>${escapeXML(credentials.password)}</Password>
        <Service>subject_search</Service>
    </Authentication>
    <Mode>${escapeXML(credentials.mode)}</Mode>
    <CompanyId>${escapeXML(credentials.company_id)}</CompanyId>
    <SearchCriteria>
        ${email ? `<Email>${escapeXML(email)}</Email>` : ''}
        ${phone ? `<Phone>${escapeXML(phone)}</Phone>` : ''}
        ${lastName ? `<LastName>${escapeXML(lastName)}</LastName>` : ''}
        ${dateRange ? `<DateRange>${escapeXML(dateRange)}</DateRange>` : ''}
    </SearchCriteria>
</TenstreetData>`

  return await makeRequest(searchXML, 'Search Applicants')
}

async function getApplicationStatus(credentials: any, driverId: string) {
  const statusXML = `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${credentials.client_id}</ClientId>
        <Password>${credentials.password}</Password>
        <Service>status_retrieve</Service>
    </Authentication>
    <Mode>${credentials.mode}</Mode>
    <CompanyId>${credentials.company_id}</CompanyId>
    <DriverId>${driverId}</DriverId>
</TenstreetData>`

  return await makeRequest(statusXML, 'Get Application Status')
}

async function updateApplicantStatus(credentials: any, driverId: string, status: string) {
  const updateXML = `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${escapeXML(credentials.client_id)}</ClientId>
        <Password>${escapeXML(credentials.password)}</Password>
        <Service>status_update</Service>
    </Authentication>
    <Mode>${escapeXML(credentials.mode)}</Mode>
    <CompanyId>${escapeXML(credentials.company_id)}</CompanyId>
    <DriverId>${escapeXML(driverId)}</DriverId>
    <Status>${escapeXML(status)}</Status>
</TenstreetData>`

  return await makeRequest(updateXML, 'Update Applicant Status')
}

async function getAvailableJobs(credentials: any) {
  const jobsXML = `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${credentials.client_id}</ClientId>
        <Password>${credentials.password}</Password>
        <Service>job_listing</Service>
    </Authentication>
    <Mode>${credentials.mode}</Mode>
    <CompanyId>${credentials.company_id}</CompanyId>
</TenstreetData>`

  return await makeRequest(jobsXML, 'Get Available Jobs')
}

async function exportApplicants(credentials: any, dateRange: any) {
  const { startDate, endDate } = dateRange
  
  const exportXML = `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${escapeXML(credentials.client_id)}</ClientId>
        <Password>${escapeXML(credentials.password)}</Password>
        <Service>export_data</Service>
    </Authentication>
    <Mode>${escapeXML(credentials.mode)}</Mode>
    <CompanyId>${escapeXML(credentials.company_id)}</CompanyId>
    <ExportCriteria>
        <StartDate>${escapeXML(startDate)}</StartDate>
        <EndDate>${escapeXML(endDate)}</EndDate>
    </ExportCriteria>
</TenstreetData>`

  return await makeRequest(exportXML, 'Export Applicants')
}

async function makeRequest(xmlPayload: string, actionName: string, maxRetries = 3) {
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

      const responseText = await response.text()
      console.log(`${actionName} - Response:`, responseText)

      return new Response(
        JSON.stringify({
          success: response.ok,
          status: response.status,
          action: actionName,
          request: xmlPayload,
          response: responseText,
          parsed: parseXMLResponse(responseText),
          attempt
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      console.error(`${actionName} - Attempt ${attempt} failed:`, error.message);
      
      // If this is the last attempt or it's an abort error, throw
      if (attempt === maxRetries || error.name === 'AbortError') {
        return new Response(
          JSON.stringify({
            success: false,
            error: error.name === 'AbortError' ? 'Request timeout (30s exceeded)' : error.message,
            action: actionName,
            attempts: attempt
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Exponential backoff before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

function buildServiceTestXML(credentials: any, serviceName: string, customPayload?: any) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${credentials.client_id}</ClientId>
        <Password>${credentials.password}</Password>
        <Service>${serviceName}</Service>
    </Authentication>
    <Mode>${credentials.mode}</Mode>
    <CompanyId>${credentials.company_id}</CompanyId>
    ${customPayload || ''}
</TenstreetData>`
}

// Validation Schemas
const GetApplicantSchema = z.object({
  driverId: z.string().min(1, 'Driver ID is required').max(100, 'Driver ID too long')
});

const SearchSchema = z.object({
  criteria: z.object({
    email: z.string().email('Invalid email format').optional(),
    phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits').optional(),
    lastName: z.string().min(1).max(100).optional(),
    dateRange: z.string().optional()
  }).refine(data => data.email || data.phone || data.lastName, {
    message: 'At least one search criterion (email, phone, or lastName) is required'
  })
});

const UpdateStatusSchema = z.object({
  driverId: z.string().min(1, 'Driver ID is required'),
  status: z.string().min(1, 'Status is required').max(50, 'Status too long')
});

const ExportSchema = z.object({
  dateRange: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD')
  })
});

const SubjectUploadSchema = z.object({
  applicantData: z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().regex(/^\d{10}$/),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().length(2).optional(),
    zip: z.string().optional()
  })
});

const SubjectUpdateSchema = z.object({
  driverId: z.string().min(1, 'Driver ID is required'),
  updates: z.record(z.any())
});

// Validation functions
function validateGetApplicantRequest(params: any) {
  GetApplicantSchema.parse(params);
}

function validateSearchRequest(params: any) {
  SearchSchema.parse(params);
}

function validateUpdateStatusRequest(params: any) {
  UpdateStatusSchema.parse(params);
}

function validateExportRequest(params: any) {
  ExportSchema.parse(params);
}

function validateSubjectUploadRequest(params: any) {
  SubjectUploadSchema.parse(params);
}

function validateSubjectUpdateRequest(params: any) {
  SubjectUpdateSchema.parse(params);
}

// New action functions
async function createApplicant(credentials: any, applicantData: any) {
  const uploadXML = `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${escapeXML(credentials.client_id)}</ClientId>
        <Password>${escapeXML(credentials.password)}</Password>
        <Service>subject_upload</Service>
    </Authentication>
    <Mode>${escapeXML(credentials.mode)}</Mode>
    <CompanyId>${escapeXML(credentials.company_id)}</CompanyId>
    <PersonalData>
        <FirstName>${escapeXML(applicantData.firstName)}</FirstName>
        <LastName>${escapeXML(applicantData.lastName)}</LastName>
        <Email>${escapeXML(applicantData.email)}</Email>
        <Phone>${escapeXML(applicantData.phone)}</Phone>
        ${applicantData.address ? `<Address>${escapeXML(applicantData.address)}</Address>` : ''}
        ${applicantData.city ? `<City>${escapeXML(applicantData.city)}</City>` : ''}
        ${applicantData.state ? `<State>${escapeXML(applicantData.state)}</State>` : ''}
        ${applicantData.zip ? `<Zip>${escapeXML(applicantData.zip)}</Zip>` : ''}
    </PersonalData>
</TenstreetData>`;

  return await makeRequest(uploadXML, 'Create Applicant');
}

async function updateApplicant(credentials: any, driverId: string, updates: any) {
  const updateFields = Object.entries(updates)
    .map(([key, value]) => `<${key}>${escapeXML(String(value))}</${key}>`)
    .join('\n        ');

  const updateXML = `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${escapeXML(credentials.client_id)}</ClientId>
        <Password>${escapeXML(credentials.password)}</Password>
        <Service>subject_update</Service>
    </Authentication>
    <Mode>${escapeXML(credentials.mode)}</Mode>
    <CompanyId>${escapeXML(credentials.company_id)}</CompanyId>
    <DriverId>${escapeXML(driverId)}</DriverId>
    <Updates>
        ${updateFields}
    </Updates>
</TenstreetData>`;

  return await makeRequest(updateXML, 'Update Applicant');
}

function parseXMLResponse(xmlText: string) {
  try {
    // Basic XML parsing to extract key information
    const errors = xmlText.match(/<error>(.*?)<\/error>/gi)
    const success = xmlText.match(/<success>(.*?)<\/success>/gi)
    const driverId = xmlText.match(/<DriverId>(.*?)<\/DriverId>/i)?.[1]
    const status = xmlText.match(/<Status>(.*?)<\/Status>/i)?.[1]
    
    return {
      hasErrors: !!errors,
      errors: errors?.map(e => e.replace(/<\/?error>/gi, '')),
      success: success?.map(s => s.replace(/<\/?success>/gi, '')),
      driverId,
      status,
      rawResponse: xmlText
    }
  } catch (error) {
    return {
      parseError: error.message,
      rawResponse: xmlText
    }
  }
}