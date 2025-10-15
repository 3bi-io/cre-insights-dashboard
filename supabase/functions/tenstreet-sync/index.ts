// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TENSTREET_CONFIG = {
  clientId: '123',
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...params } = await req.json()
    
    console.log(`Tenstreet Sync: ${action}`)

    switch (action) {
      case 'sync_applicants':
        return await syncApplicantsFromTenstreet(supabaseClient, params)
      
      case 'push_applicant':
        return await pushApplicantToTenstreet(supabaseClient, params)
      
      case 'update_status':
        return await updateApplicantStatus(supabaseClient, params)
      
      case 'search_and_sync':
        return await searchAndSyncApplicant(supabaseClient, params)
        
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Tenstreet Sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function syncApplicantsFromTenstreet(supabaseClient: any, params: any) {
  const { dateRange, email, phone, lastName } = params
  
  // Build search XML
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
        ${dateRange?.startDate ? `<StartDate>${dateRange.startDate}</StartDate>` : ''}
        ${dateRange?.endDate ? `<EndDate>${dateRange.endDate}</EndDate>` : ''}
    </SearchCriteria>
</TenstreetData>`

  console.log('Search XML:', searchXML)

  // Call Tenstreet API
  const response = await fetch('https://dashboard.tenstreet.com/post/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml',
    },
    body: searchXML
  })

  const responseText = await response.text()
  console.log('Tenstreet response:', responseText)

  // Parse response and extract applicants
  const parsed = parseApplicantsFromXML(responseText)
  
  if (!parsed.applicants || parsed.applicants.length === 0) {
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
  for (const applicant of parsed.applicants) {
    try {
      // Check if applicant exists
      const { data: existing } = await supabaseClient
        .from('applications')
        .select('id, driver_id')
        .eq('driver_id', applicant.driverId)
        .single()

      if (existing) {
        // Update existing applicant
        const { data, error } = await supabaseClient
          .from('applications')
          .update({
            first_name: applicant.firstName,
            last_name: applicant.lastName,
            applicant_email: applicant.email,
            phone: applicant.phone,
            status: applicant.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()

        if (!error) {
          syncedApplicants.push({ ...data[0], action: 'updated' })
        }
      } else {
        // Insert new applicant
        const { data, error } = await supabaseClient
          .from('applications')
          .insert({
            driver_id: applicant.driverId,
            first_name: applicant.firstName,
            last_name: applicant.lastName,
            applicant_email: applicant.email,
            phone: applicant.phone,
            status: applicant.status,
            source: 'Tenstreet',
            applied_at: applicant.appliedAt || new Date().toISOString()
          })
          .select()

        if (!error) {
          syncedApplicants.push({ ...data[0], action: 'created' })
        }
      }
    } catch (error) {
      console.error('Error syncing applicant:', applicant.driverId, error)
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      synced: syncedApplicants.length,
      applicants: syncedApplicants,
      rawResponse: responseText
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function pushApplicantToTenstreet(supabaseClient: any, params: any) {
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

  // Build Tenstreet upload XML
  const uploadXML = buildTenstreetUploadXML(application)

  console.log('Upload XML:', uploadXML)

  // Send to Tenstreet
  const response = await fetch('https://dashboard.tenstreet.com/post/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml',
    },
    body: uploadXML
  })

  const responseText = await response.text()
  console.log('Tenstreet upload response:', responseText)

  const parsed = parseXMLResponse(responseText)

  // Update application with driver_id if successful
  if (parsed.driverId) {
    await supabaseClient
      .from('applications')
      .update({
        driver_id: parsed.driverId,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
  }

  return new Response(
    JSON.stringify({
      success: !parsed.hasErrors,
      driverId: parsed.driverId,
      response: responseText,
      parsed
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateApplicantStatus(supabaseClient: any, params: any) {
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

  // Build status update XML
  const statusXML = `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${TENSTREET_CONFIG.clientId}</ClientId>
        <Password>${TENSTREET_CONFIG.password}</Password>
        <Service>status_update</Service>
    </Authentication>
    <Mode>${TENSTREET_CONFIG.mode}</Mode>
    <CompanyId>${TENSTREET_CONFIG.companyId}</CompanyId>
    <DriverId>${application.driver_id}</DriverId>
    <Status>${status}</Status>
    ${statusTag ? `<StatusTag>${statusTag}</StatusTag>` : ''}
</TenstreetData>`

  console.log('Status update XML:', statusXML)

  const response = await fetch('https://dashboard.tenstreet.com/post/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml',
    },
    body: statusXML
  })

  const responseText = await response.text()
  console.log('Status update response:', responseText)

  // Update local database
  await supabaseClient
    .from('applications')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', applicationId)

  return new Response(
    JSON.stringify({
      success: response.ok,
      status,
      response: responseText,
      parsed: parseXMLResponse(responseText)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function searchAndSyncApplicant(supabaseClient: any, params: any) {
  const { email, phone, driverId } = params

  // Search for applicant in Tenstreet
  const searchXML = `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${TENSTREET_CONFIG.clientId}</ClientId>
        <Password>${TENSTREET_CONFIG.password}</Password>
        <Service>${driverId ? 'subject_retrieve' : 'subject_search'}</Service>
    </Authentication>
    <Mode>${TENSTREET_CONFIG.mode}</Mode>
    <CompanyId>${TENSTREET_CONFIG.companyId}</CompanyId>
    ${driverId ? `<DriverId>${driverId}</DriverId>` : ''}
    ${!driverId ? `<SearchCriteria>
        ${email ? `<Email>${email}</Email>` : ''}
        ${phone ? `<Phone>${phone}</Phone>` : ''}
    </SearchCriteria>` : ''}
</TenstreetData>`

  const response = await fetch('https://dashboard.tenstreet.com/post/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml',
    },
    body: searchXML
  })

  const responseText = await response.text()
  const parsed = parseApplicantData(responseText)

  return new Response(
    JSON.stringify({
      success: response.ok,
      applicant: parsed,
      rawResponse: responseText
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function buildTenstreetUploadXML(application: any) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${TENSTREET_CONFIG.clientId}</ClientId>
        <Password>${TENSTREET_CONFIG.password}</Password>
        <Service>subject_upload</Service>
    </Authentication>
    <Mode>${TENSTREET_CONFIG.mode}</Mode>
    <Source>ATS Integration</Source>
    <CompanyId>${TENSTREET_CONFIG.companyId}</CompanyId>
    <CompanyName>${TENSTREET_CONFIG.companyName}</CompanyName>
    ${application.driver_id ? `<DriverId>${application.driver_id}</DriverId>` : ''}
    ${application.job_listings?.job_id ? `<JobId>${application.job_listings.job_id}</JobId>` : ''}
    <PersonalData>
        <PersonName>
            ${application.prefix ? `<Prefix>${application.prefix}</Prefix>` : ''}
            <GivenName>${application.first_name || ''}</GivenName>
            ${application.middle_name ? `<MiddleName>${application.middle_name}</MiddleName>` : ''}
            <FamilyName>${application.last_name || ''}</FamilyName>
            ${application.suffix ? `<Affix>${application.suffix}</Affix>` : ''}
        </PersonName>
        <PostalAddress>
            <CountryCode>${application.country || 'US'}</CountryCode>
            <Municipality>${application.city || ''}</Municipality>
            <Region>${application.state || ''}</Region>
            <PostalCode>${application.zip || ''}</PostalCode>
            ${application.address_1 ? `<Address1>${application.address_1}</Address1>` : ''}
            ${application.address_2 ? `<Address2>${application.address_2}</Address2>` : ''}
        </PostalAddress>
        ${application.ssn || application.government_id ? `<GovernmentID>
            <Value>${application.government_id || application.ssn || ''}</Value>
            <CountryCode>US</CountryCode>
            <IssuingAuthority>${application.government_id_type || 'SSN'}</IssuingAuthority>
            <DocumentType>${application.government_id_type || 'SSN'}</DocumentType>
        </GovernmentID>` : ''}
        ${application.date_of_birth ? `<DateOfBirth>${application.date_of_birth}</DateOfBirth>` : ''}
        <ContactData>
            <InternetEmailAddress>${application.applicant_email || ''}</InternetEmailAddress>
            ${application.phone ? `<PrimaryPhone>${application.phone}</PrimaryPhone>` : ''}
            ${application.secondary_phone ? `<SecondaryPhone>${application.secondary_phone}</SecondaryPhone>` : ''}
            ${application.preferred_contact_method ? `<PreferredMethod>${application.preferred_contact_method}</PreferredMethod>` : ''}
        </ContactData>
    </PersonalData>
    ${buildApplicationData(application)}
</TenstreetData>`
}

function buildApplicationData(application: any) {
  const customQuestions = []
  const displayFields = []

  // Map application fields to custom questions
  if (application.cdl) {
    customQuestions.push(`<CustomQuestion>
            <QuestionId>cdl_class</QuestionId>
            <Question>CDL Class</Question>
            <Answer>${application.cdl}</Answer>
        </CustomQuestion>`)
  }

  if (application.exp) {
    customQuestions.push(`<CustomQuestion>
            <QuestionId>experience</QuestionId>
            <Question>Years of Experience</Question>
            <Answer>${application.exp}</Answer>
        </CustomQuestion>`)
  }

  // Add display fields
  if (application.source) {
    displayFields.push(`<DisplayField>
            <DisplayPrompt>Application Source</DisplayPrompt>
            <DisplayValue>${application.source}</DisplayValue>
        </DisplayField>`)
  }

  if (customQuestions.length === 0 && displayFields.length === 0) {
    return ''
  }

  return `<ApplicationData>
        ${customQuestions.length > 0 ? `<CustomQuestions>${customQuestions.join('\n')}</CustomQuestions>` : ''}
        ${displayFields.length > 0 ? `<DisplayFields>${displayFields.join('\n')}</DisplayFields>` : ''}
    </ApplicationData>`
}

function parseApplicantsFromXML(xmlText: string) {
  const applicants = []
  
  // Extract each applicant (this is simplified - actual parsing would be more complex)
  const driverIdMatches = xmlText.matchAll(/<DriverId>(.*?)<\/DriverId>/gi)
  
  for (const match of driverIdMatches) {
    applicants.push({
      driverId: match[1],
      firstName: extractXMLTag(xmlText, 'GivenName'),
      lastName: extractXMLTag(xmlText, 'FamilyName'),
      email: extractXMLTag(xmlText, 'InternetEmailAddress'),
      phone: extractXMLTag(xmlText, 'PrimaryPhone'),
      status: extractXMLTag(xmlText, 'Status') || 'pending',
      appliedAt: extractXMLTag(xmlText, 'SubmitDate')
    })
  }

  return { applicants }
}

function parseApplicantData(xmlText: string) {
  return {
    driverId: extractXMLTag(xmlText, 'DriverId'),
    firstName: extractXMLTag(xmlText, 'GivenName'),
    lastName: extractXMLTag(xmlText, 'FamilyName'),
    email: extractXMLTag(xmlText, 'InternetEmailAddress'),
    phone: extractXMLTag(xmlText, 'PrimaryPhone'),
    status: extractXMLTag(xmlText, 'Status'),
    city: extractXMLTag(xmlText, 'Municipality'),
    state: extractXMLTag(xmlText, 'Region'),
    zip: extractXMLTag(xmlText, 'PostalCode')
  }
}

function parseXMLResponse(xmlText: string) {
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
}

function extractXMLTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'i'))
  return match ? match[1] : null
}
