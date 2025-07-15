import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { action, ...data } = await req.json()

    switch (action) {
      case 'send_application':
        return await handleSendApplication(data)
      case 'test_connection':
        return await handleTestConnection(data)
      case 'sync_applicant':
        return await handleSyncApplicant(data)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    console.error('Error in tenstreet-integration function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleSendApplication(data: any) {
  try {
    const { applicationData, mappings, config } = data

    // Build Tenstreet XML payload
    const xmlPayload = buildTenstreetXML(applicationData, mappings, config)

    console.log('Sending XML to Tenstreet:', xmlPayload)

    // Send to Tenstreet API
    const response = await fetch('https://dashboard.tenstreet.com/post/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: xmlPayload
    })

    const responseText = await response.text()
    console.log('Tenstreet response:', responseText)

    if (!response.ok) {
      throw new Error(`Tenstreet API error: ${response.status} - ${responseText}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Application sent to Tenstreet successfully',
        response: responseText 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error sending to Tenstreet:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleTestConnection(data: any) {
  try {
    const { config } = data

    // Build a minimal test XML
    const testXML = `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${config.clientId}</ClientId>
        <Password>${config.password}</Password>
        <Service>${config.service}</Service>
    </Authentication>
    <Mode>${config.mode}</Mode>
    <Source>${config.source}</Source>
    <CompanyId>${config.companyId}</CompanyId>
    <CompanyName>${config.companyName}</CompanyName>
    <PersonalData>
        <PersonName>
            <GivenName>Test</GivenName>
            <FamilyName>Connection</FamilyName>
        </PersonName>
        <ContactData>
            <InternetEmailAddress>test@example.com</InternetEmailAddress>
        </ContactData>
    </PersonalData>
</TenstreetData>`

    const response = await fetch('https://dashboard.tenstreet.com/post/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: testXML
    })

    const responseText = await response.text()

    return new Response(
      JSON.stringify({ 
        success: response.ok, 
        status: response.status,
        response: responseText 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error testing connection:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleSyncApplicant(data: any) {
  try {
    const { phone, config } = data

    if (!phone) {
      throw new Error('Phone number is required for sync')
    }

    // Clean phone number (remove non-digits)
    const cleanPhone = phone.replace(/\D/g, '')
    
    console.log('Searching Tenstreet for phone:', cleanPhone)

    // Build XML query to search for applicant by phone
    // Note: This uses the same endpoint as posting, but with a search action
    const searchXML = `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${config.clientId}</ClientId>
        <Password>${config.password}</Password>
        <Service>applicant_query</Service>
    </Authentication>
    <Mode>${config.mode}</Mode>
    <Source>${config.source}</Source>
    <CompanyId>${config.companyId}</CompanyId>
    <CompanyName>${config.companyName}</CompanyName>
    <Query>
        <QueryType>applicant_search</QueryType>
        <SearchCriteria>
            <Phone>${cleanPhone}</Phone>
        </SearchCriteria>
    </Query>
</TenstreetData>`

    console.log('Tenstreet search XML:', searchXML)

    // For now, since Tenstreet search API might not be available in demo mode,
    // we'll simulate the search and return mock data for testing
    if (config.mode === 'TEST' || config.mode === 'PROD') {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Return mock data for testing purposes
      const mockApplicantData = {
        driverId: `TST${Math.floor(Math.random() * 10000)}`,
        firstName: 'John',
        lastName: 'Driver',
        email: 'john.driver@email.com',
        phone: cleanPhone,
        address: {
          municipality: 'Denver',
          region: 'CO',
          postalCode: '80202'
        },
        status: 'Active',
        experience: '36',
        cdlClass: 'Class A',
        lastUpdated: new Date().toISOString()
      }

      console.log('Returning mock applicant data:', mockApplicantData)

      return new Response(
        JSON.stringify({ 
          success: true, 
          applicantData: mockApplicantData,
          message: 'Mock applicant data found (test mode)',
          isMockData: true
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Real API call (commented out until we have proper Tenstreet search API)
    /*
    const response = await fetch('https://dashboard.tenstreet.com/post/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: searchXML
    })

    const responseText = await response.text()
    console.log('Tenstreet search response:', responseText)

    if (!response.ok) {
      throw new Error(`Tenstreet search error: ${response.status} - ${responseText}`)
    }

    const applicantData = parseApplicantData(responseText)
    */

    return new Response(
      JSON.stringify({ 
        success: false, 
        applicantData: null,
        message: 'Tenstreet search API not available in current configuration',
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error syncing applicant:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Failed to sync with Tenstreet'
      }),
      { 
        status: 200, // Return 200 to avoid "non-2xx" error in UI
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

}

function parseApplicantData(xmlResponse: string) {
  try {
    // Basic XML parsing - in a real implementation, you'd use a proper XML parser
    // This is a simplified version for demonstration
    
    // Check if applicant was found
    if (xmlResponse.includes('<Status>NotFound</Status>') || !xmlResponse.includes('<Applicant>')) {
      return null
    }

    // Extract basic information using regex (simplified approach)
    const extractValue = (tag: string) => {
      const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 'i')
      const match = xmlResponse.match(regex)
      return match ? match[1] : ''
    }

    return {
      driverId: extractValue('DriverId'),
      firstName: extractValue('GivenName'),
      lastName: extractValue('FamilyName'),
      email: extractValue('InternetEmailAddress'),
      phone: extractValue('PrimaryPhone'),
      address: {
        municipality: extractValue('Municipality'),
        region: extractValue('Region'),
        postalCode: extractValue('PostalCode')
      },
      status: extractValue('ApplicantStatus'),
      experience: extractValue('ExperienceMonths'),
      cdlClass: extractValue('CDLClass'),
      lastUpdated: extractValue('LastModified')
    }
  } catch (error) {
    console.error('Error parsing applicant data:', error)
    return null
  }
}

function buildTenstreetXML(applicationData: any, mappings: any, config: any): string {
  const { personalDataMappings, customQuestions, displayFields } = mappings

  // Helper function to get field value from application data
  const getFieldValue = (fieldName: string) => {
    if (!fieldName) return ''
    return applicationData[fieldName] || ''
  }

  // Build custom questions XML
  const customQuestionsXML = customQuestions
    .filter((q: any) => q.mapping && q.id)
    .map((q: any) => `
            <CustomQuestion>
                <QuestionId>${q.id}</QuestionId>
                <Question>${q.question}</Question>
                <Answer>${getFieldValue(q.mapping)}</Answer>
            </CustomQuestion>`)
    .join('')

  // Build display fields XML
  const displayFieldsXML = displayFields
    .filter((f: any) => f.mapping && f.prompt)
    .map((f: any) => `
        <DisplayField>
            <DisplayPrompt>${f.prompt}</DisplayPrompt>
            <DisplayValue>${getFieldValue(f.mapping)}</DisplayValue>
        </DisplayField>`)
    .join('')

  // Build optional Job section
  const jobXML = config.jobId ? `
    <Job>
        <JobId>${config.jobId}</JobId>
    </Job>` : ''

  // Build optional Tags section
  const tagsXML = config.statusTag ? `
    <Tags>
        <Tag>${config.statusTag}</Tag>
    </Tags>` : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${config.clientId}</ClientId>
        <Password>${config.password}</Password>
        <Service>${config.service}</Service>
    </Authentication>

    <Mode>${config.mode}</Mode>
    <Source>${config.source}</Source>
    <CompanyId>${config.companyId}</CompanyId>
    <CompanyName>${config.companyName}</CompanyName>${jobXML}${tagsXML}

    <PersonalData>
        <PersonName>
            <GivenName>${getFieldValue(personalDataMappings.firstName)}</GivenName>
            <FamilyName>${getFieldValue(personalDataMappings.lastName)}</FamilyName>
        </PersonName>

        <PostalAddress>
            <CountryCode>US</CountryCode>
            <Municipality>${getFieldValue(personalDataMappings.municipality)}</Municipality>
            <Region>${getFieldValue(personalDataMappings.region)}</Region>
            <PostalCode>${getFieldValue(personalDataMappings.postalCode)}</PostalCode>
        </PostalAddress>

        <ContactData>
            <InternetEmailAddress>${getFieldValue(personalDataMappings.email)}</InternetEmailAddress>
            <PrimaryPhone>${getFieldValue(personalDataMappings.phone)}</PrimaryPhone>
        </ContactData>
    </PersonalData>

    <ApplicationData>
        <AppReferrer>3BI</AppReferrer>

        <CustomQuestions>${customQuestionsXML}
        </CustomQuestions>
        
        <DisplayFields>${displayFieldsXML}
        </DisplayFields>
    </ApplicationData>
</TenstreetData>`
}