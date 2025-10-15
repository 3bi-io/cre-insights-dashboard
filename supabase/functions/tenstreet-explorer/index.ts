// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// CR England credentials
const TENSTREET_CONFIG = {
  clientId: '123', // Replace with actual client ID
  password: 'lS%!r3pjy@0SzMs!8Ln',
  service: 'subject_upload',
  mode: 'PROD',
  companyId: '1300',
  companyName: 'C.R. England'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, ...params } = await req.json()
    
    console.log(`Tenstreet Explorer: ${action}`)

    switch (action) {
      case 'explore_services':
        return await exploreAvailableServices()
      
      case 'test_service':
        return await testService(params.service, params.payload)
      
      case 'get_applicant_data':
        return await getApplicantData(params.driverId)
      
      case 'search_applicants':
        return await searchApplicants(params.criteria)
      
      case 'get_application_status':
        return await getApplicationStatus(params.driverId)
      
      case 'update_applicant_status':
        return await updateApplicantStatus(params.driverId, params.status)
      
      case 'get_available_jobs':
        return await getAvailableJobs()
      
      case 'export_applicants':
        return await exportApplicants(params.dateRange)
        
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

async function exploreAvailableServices() {
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
      note: 'Tenstreet uses SOAP/XML-based API. Contact Tenstreet support for complete API documentation.'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function testService(serviceName: string, customPayload?: any) {
  const testXML = buildServiceTestXML(serviceName, customPayload)
  
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

async function getApplicantData(driverId: string) {
  const retrieveXML = `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${TENSTREET_CONFIG.clientId}</ClientId>
        <Password>${TENSTREET_CONFIG.password}</Password>
        <Service>subject_retrieve</Service>
    </Authentication>
    <Mode>${TENSTREET_CONFIG.mode}</Mode>
    <CompanyId>${TENSTREET_CONFIG.companyId}</CompanyId>
    <DriverId>${driverId}</DriverId>
</TenstreetData>`

  return await makeRequest(retrieveXML, 'Get Applicant Data')
}

async function searchApplicants(criteria: any) {
  const { email, phone, lastName, dateRange } = criteria
  
  const searchXML = `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${TENSTREET_CONFIG.clientId}</ClientId>
        <Password>${TENSTREET_CONFIG.password}</Password>
        <Service>subject_search</Service>
    </Authentication>
    <Mode>${TENSTREET_CONFIG.mode}</Mode>
    <CompanyId>${TENSTREET_CONFIG.companyId}</CompanyId>
    <SearchCriteria>
        ${email ? `<Email>${email}</Email>` : ''}
        ${phone ? `<Phone>${phone}</Phone>` : ''}
        ${lastName ? `<LastName>${lastName}</LastName>` : ''}
        ${dateRange ? `<DateRange>${dateRange}</DateRange>` : ''}
    </SearchCriteria>
</TenstreetData>`

  return await makeRequest(searchXML, 'Search Applicants')
}

async function getApplicationStatus(driverId: string) {
  const statusXML = `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${TENSTREET_CONFIG.clientId}</ClientId>
        <Password>${TENSTREET_CONFIG.password}</Password>
        <Service>status_retrieve</Service>
    </Authentication>
    <Mode>${TENSTREET_CONFIG.mode}</Mode>
    <CompanyId>${TENSTREET_CONFIG.companyId}</CompanyId>
    <DriverId>${driverId}</DriverId>
</TenstreetData>`

  return await makeRequest(statusXML, 'Get Application Status')
}

async function updateApplicantStatus(driverId: string, status: string) {
  const updateXML = `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${TENSTREET_CONFIG.clientId}</ClientId>
        <Password>${TENSTREET_CONFIG.password}</Password>
        <Service>status_update</Service>
    </Authentication>
    <Mode>${TENSTREET_CONFIG.mode}</Mode>
    <CompanyId>${TENSTREET_CONFIG.companyId}</CompanyId>
    <DriverId>${driverId}</DriverId>
    <Status>${status}</Status>
</TenstreetData>`

  return await makeRequest(updateXML, 'Update Applicant Status')
}

async function getAvailableJobs() {
  const jobsXML = `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${TENSTREET_CONFIG.clientId}</ClientId>
        <Password>${TENSTREET_CONFIG.password}</Password>
        <Service>job_listing</Service>
    </Authentication>
    <Mode>${TENSTREET_CONFIG.mode}</Mode>
    <CompanyId>${TENSTREET_CONFIG.companyId}</CompanyId>
</TenstreetData>`

  return await makeRequest(jobsXML, 'Get Available Jobs')
}

async function exportApplicants(dateRange: any) {
  const { startDate, endDate } = dateRange
  
  const exportXML = `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${TENSTREET_CONFIG.clientId}</ClientId>
        <Password>${TENSTREET_CONFIG.password}</Password>
        <Service>export_data</Service>
    </Authentication>
    <Mode>${TENSTREET_CONFIG.mode}</Mode>
    <CompanyId>${TENSTREET_CONFIG.companyId}</CompanyId>
    <ExportCriteria>
        <StartDate>${startDate}</StartDate>
        <EndDate>${endDate}</EndDate>
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

function buildServiceTestXML(serviceName: string, customPayload?: any) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${TENSTREET_CONFIG.clientId}</ClientId>
        <Password>${TENSTREET_CONFIG.password}</Password>
        <Service>${serviceName}</Service>
    </Authentication>
    <Mode>${TENSTREET_CONFIG.mode}</Mode>
    <CompanyId>${TENSTREET_CONFIG.companyId}</CompanyId>
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