// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

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

    // Super admins can access ATS Explorer without an org and can specify which org's credentials to use
    if (isSuperAdmin) {
      console.log('Super admin access - allowing without organization check')
      
      // Parse request body to check for organization override
      const requestBody = await req.json()
      const organizationSlug = requestBody.organization_slug || 'cr-england' // Default to CR England
      
      // Get organization ID from slug
      const { data: orgData } = await supabaseClient
        .from('organizations')
        .select('id')
        .eq('slug', organizationSlug)
        .single()
      
      if (orgData) {
        targetOrgId = orgData.id
        console.log(`Super admin using credentials for organization: ${organizationSlug} (${targetOrgId})`)
      }
      
      // Restore the request body for later use
      req = new Request(req.url, {
        method: req.method,
        headers: req.headers,
        body: JSON.stringify(requestBody)
      })
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

    // Fetch Tenstreet credentials for the target organization
    const { data: credentials, error: credError } = await supabaseClient
      .from('tenstreet_credentials')
      .select('*')
      .eq('organization_id', targetOrgId)
      .maybeSingle()

    if (credError) {
      console.error('Error fetching credentials:', credError)
      throw new Error('Failed to fetch Tenstreet credentials')
    }

    if (!credentials) {
      const orgMsg = isSuperAdmin ? 'the specified organization' : 'your organization'
      return new Response(
        JSON.stringify({ 
          error: `No Tenstreet credentials configured for ${orgMsg}. Please contact your administrator.` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Using credentials for organization:', targetOrgId)
    console.log('Mode:', credentials.mode)

    const { action, ...params } = await req.json()
    
    console.log(`Tenstreet Explorer: ${action}`)

    switch (action) {
      case 'explore_services':
        return await exploreAvailableServices(credentials)
      
      case 'test_service':
        return await testService(credentials, params.service, params.payload)
      
      case 'get_applicant_data':
        return await getApplicantData(credentials, params.driverId)
      
      case 'search_applicants':
        return await searchApplicants(credentials, params.criteria)
      
      case 'get_application_status':
        return await getApplicationStatus(credentials, params.driverId)
      
      case 'update_applicant_status':
        return await updateApplicantStatus(credentials, params.driverId, params.status)
      
      case 'get_available_jobs':
        return await getAvailableJobs(credentials)
      
      case 'export_applicants':
        return await exportApplicants(credentials, params.dateRange)
        
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

async function makeRequest(xmlPayload: string, actionName: string) {
  try {
    console.log(`${actionName} - XML Request:`, xmlPayload)
    
    const response = await fetch('https://dashboard.tenstreet.com/post/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: xmlPayload
    })

    const responseText = await response.text()
    console.log(`${actionName} - Response:`, responseText)

    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        action: actionName,
        request: xmlPayload,
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
        action: actionName
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
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