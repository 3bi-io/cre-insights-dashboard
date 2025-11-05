// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { getCorsHeaders } from '../_shared/cors-config.ts'

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
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
        return await handleSendApplication(data, corsHeaders)
      case 'test_connection':
        return await handleTestConnection(data, corsHeaders)
      case 'sync_applicant':
        return await handleSyncApplicant(data, corsHeaders)
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

async function handleSendApplication(data: any, corsHeaders: Record<string, string>) {
  try {
    const { applicationData, mappings, config } = data

    // Build Tenstreet XML payload
    const xmlPayload = buildTenstreetXML(applicationData, mappings, config)

    console.log('Sending application to Tenstreet for:', applicationData.applicant_email)

    // Send to Tenstreet API
    const response = await fetch('https://dashboard.tenstreet.com/post/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: xmlPayload
    })

    const responseText = await response.text()
    console.log('Tenstreet response status:', response.status)

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

async function handleTestConnection(data: any, corsHeaders: Record<string, string>) {
  try {
    const { config } = data

    // Build enhanced test XML with all supported fields
    const testXML = buildTestXML(config)
    
    console.log('Testing Tenstreet connection')

    const response = await fetch('https://dashboard.tenstreet.com/post/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: testXML
    })

    const responseText = await response.text()
    
    console.log('Tenstreet test response status:', response.status)

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

async function handleSyncApplicant(data: any, corsHeaders: Record<string, string>) {
  try {
    const { phone } = data

    // Mock sync functionality - in real implementation, this would query Tenstreet API
    // For now, return mock data
    const mockData = {
      found: true,
      applicantData: {
        driverId: '123456789',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: phone,
        cdlClass: 'A',
        experienceMonths: '24',
        veteranStatus: 'No'
      }
    }

    return new Response(
      JSON.stringify(mockData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error syncing applicant:', error)
    return new Response(
      JSON.stringify({ 
        found: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

// Helper function to safely get field value from application data
function getFieldValue(applicationData: any, fieldName: string): string {
  if (!fieldName || !applicationData) return ''
  
  // Handle nested field access
  if (fieldName.includes('.')) {
    const parts = fieldName.split('.')
    let value = applicationData
    for (const part of parts) {
      value = value?.[part]
      if (value === undefined || value === null) return ''
    }
    return String(value)
  }
  
  const value = applicationData[fieldName]
  if (value === undefined || value === null) return ''
  return String(value)
}

// Helper function to format phone number
function formatPhoneNumber(phone: string): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}

// Helper function to format date
function formatDate(dateValue: string): string {
  if (!dateValue) return ''
  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return dateValue
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
  } catch (error) {
    return dateValue
  }
}

// Helper function to format SSN
function formatSSN(ssn: string): string {
  if (!ssn) return ''
  const digits = ssn.replace(/\D/g, '')
  if (digits.length === 9) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
  }
  return ssn
}

// Helper function to escape XML special characters
function escapeXML(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Build comprehensive test XML
function buildTestXML(config: any): string {
  console.log('Building test XML with config:', JSON.stringify(config))
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${escapeXML(config.clientId)}</ClientId>
        <Password><![CDATA[${config.password}]]></Password>
        <Service>${escapeXML(config.service || 'subject_upload')}</Service>
    </Authentication>
    <Mode>${escapeXML(config.mode || 'PROD')}</Mode>
    <Source>${escapeXML(config.source)}</Source>
    <CompanyId>${escapeXML(config.companyId)}</CompanyId>
    <CompanyName>${escapeXML(config.companyName)}</CompanyName>
    <DriverId>TEST123456</DriverId>
    <PersonalData>
        <PersonName>
            <Prefix>Mr.</Prefix>
            <GivenName>Test</GivenName>
            <MiddleName>Q</MiddleName>
            <FamilyName>Connection</FamilyName>
            <Affix>Jr.</Affix>
        </PersonName>
        <PostalAddress>
            <CountryCode>US</CountryCode>
            <Municipality>Test City</Municipality>
            <Region>TX</Region>
            <PostalCode>12345</PostalCode>
            <Address1>123 Test Street</Address1>
            <Address2>Apt 456</Address2>
        </PostalAddress>
        <GovernmentID countryCode="US" issuingAuthority="SSA" documentType="SSN">
            123-45-6789
        </GovernmentID>
        <DateOfBirth>01/01/1990</DateOfBirth>
        <ContactData PreferredMethod="PrimaryPhone">
            <InternetEmailAddress>test@example.com</InternetEmailAddress>
            <PrimaryPhone>555-123-4567</PrimaryPhone>
            <SecondaryPhone>555-987-6543</SecondaryPhone>
        </ContactData>
    </PersonalData>
</TenstreetData>`
}

// Build comprehensive Tenstreet XML with all supported fields
function buildTenstreetXML(applicationData: any, mappings: any, config: any): string {
  const { personalData, customQuestions, displayFields } = mappings

  // Build PersonName section
  const personNameXML = `
        <PersonName>
            <Prefix>${getFieldValue(applicationData, personalData?.prefix || '')}</Prefix>
            <GivenName>${getFieldValue(applicationData, personalData?.givenName || personalData?.firstName || '')}</GivenName>
            <MiddleName>${getFieldValue(applicationData, personalData?.middleName || '')}</MiddleName>
            <FamilyName>${getFieldValue(applicationData, personalData?.familyName || personalData?.lastName || '')}</FamilyName>
            <Affix>${getFieldValue(applicationData, personalData?.affix || '')}</Affix>
        </PersonName>`

  // Build PostalAddress section
  const postalAddressXML = `
        <PostalAddress>
            <CountryCode>${getFieldValue(applicationData, personalData?.countryCode || '') || 'US'}</CountryCode>
            <Municipality>${getFieldValue(applicationData, personalData?.municipality || personalData?.city || '')}</Municipality>
            <Region>${getFieldValue(applicationData, personalData?.region || personalData?.state || '')}</Region>
            <PostalCode>${getFieldValue(applicationData, personalData?.postalCode || personalData?.zipCode || '')}</PostalCode>
            <Address1>${getFieldValue(applicationData, personalData?.address1 || personalData?.address || '')}</Address1>
            <Address2>${getFieldValue(applicationData, personalData?.address2 || '')}</Address2>
        </PostalAddress>`

  // Build GovernmentID section (optional)
  const governmentIdValue = getFieldValue(applicationData, personalData?.governmentId || personalData?.ssn || '')
  const governmentIdXML = governmentIdValue ? `
        <GovernmentID countryCode="${getFieldValue(applicationData, personalData?.governmentIdCountryCode || '') || 'US'}" 
                      issuingAuthority="${getFieldValue(applicationData, personalData?.governmentIdIssuingAuthority || '') || 'SSA'}" 
                      documentType="${getFieldValue(applicationData, personalData?.governmentIdDocumentType || '') || 'SSN'}">
            ${formatSSN(governmentIdValue)}
        </GovernmentID>` : ''

  // Build DateOfBirth section (optional)
  const dateOfBirth = formatDate(getFieldValue(applicationData, personalData?.dateOfBirth || ''))
  const dateOfBirthXML = dateOfBirth ? `
        <DateOfBirth>${dateOfBirth}</DateOfBirth>` : ''

  // Build ContactData section
  const primaryPhone = formatPhoneNumber(getFieldValue(applicationData, personalData?.primaryPhone || personalData?.phone || ''))
  const secondaryPhone = formatPhoneNumber(getFieldValue(applicationData, personalData?.secondaryPhone || ''))
  const preferredMethod = getFieldValue(applicationData, personalData?.preferredMethod || '') || 'PrimaryPhone'
  
  const contactDataXML = `
        <ContactData PreferredMethod="${preferredMethod}">
            <InternetEmailAddress>${getFieldValue(applicationData, personalData?.internetEmailAddress || personalData?.email || '')}</InternetEmailAddress>
            ${primaryPhone ? `<PrimaryPhone>${primaryPhone}</PrimaryPhone>` : ''}
            ${secondaryPhone ? `<SecondaryPhone>${secondaryPhone}</SecondaryPhone>` : ''}
        </ContactData>`

  // Build custom questions XML
  const customQuestionsXML = customQuestions && Array.isArray(customQuestions)
    ? customQuestions
        .filter((q: any) => q.mapping && q.questionId && getFieldValue(applicationData, q.mapping))
        .map((q: any) => `
            <CustomQuestion>
                <QuestionId>${q.questionId}</QuestionId>
                <Question>${q.question || ''}</Question>
                <Answer>${getFieldValue(applicationData, q.mapping)}</Answer>
            </CustomQuestion>`)
        .join('')
    : ''

  // Build display fields XML
  const displayFieldsXML = displayFields && Array.isArray(displayFields)
    ? displayFields
        .filter((f: any) => f.mapping && f.displayPrompt && getFieldValue(applicationData, f.mapping))
        .map((f: any) => `
        <DisplayField>
            <DisplayPrompt>${f.displayPrompt}</DisplayPrompt>
            <DisplayValue>${getFieldValue(applicationData, f.mapping)}</DisplayValue>
        </DisplayField>`)
        .join('')
    : ''

  // Build optional DriverId section
  const driverId = config.driverId || getFieldValue(applicationData, 'driver_id') || getFieldValue(applicationData, 'id')
  const driverIdXML = driverId ? `
    <DriverId>${driverId}</DriverId>` : ''

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
        <ClientId>${escapeXML(config.clientId)}</ClientId>
        <Password><![CDATA[${config.password}]]></Password>
        <Service>${escapeXML(config.service || 'subject_upload')}</Service>
    </Authentication>
    <Mode>${escapeXML(config.mode || 'PROD')}</Mode>
    <Source>${escapeXML(config.source)}</Source>
    <CompanyId>${escapeXML(config.companyId)}</CompanyId>
    <CompanyName>${escapeXML(config.companyName)}</CompanyName>${driverIdXML}${jobXML}${tagsXML}
    <PersonalData>${personNameXML}${postalAddressXML}${governmentIdXML}${dateOfBirthXML}${contactDataXML}
    </PersonalData>
    <ApplicationData>
        <AppReferrer>${config.appReferrer || '3BI'}</AppReferrer>
        <CustomQuestions>${customQuestionsXML}
        </CustomQuestions>
        <DisplayFields>${displayFieldsXML}
        </DisplayFields>
    </ApplicationData>
</TenstreetData>`
}