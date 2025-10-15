// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Parse incoming Tenstreet webhook
    const contentType = req.headers.get('content-type') || ''
    
    let webhookData
    if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      const xmlText = await req.text()
      console.log('Received Tenstreet webhook XML:', xmlText)
      webhookData = parseWebhookXML(xmlText)
    } else {
      webhookData = await req.json()
      console.log('Received Tenstreet webhook JSON:', webhookData)
    }

    // Process webhook based on event type
    const result = await processWebhook(supabaseClient, webhookData)

    return new Response(
      JSON.stringify({
        success: true,
        processed: result
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Tenstreet webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function processWebhook(supabaseClient: any, webhookData: any) {
  const { eventType, driverId, status, personalData, applicationData } = webhookData

  console.log('Processing webhook:', { eventType, driverId, status })

  // Find existing application by driver_id
  const { data: existingApp } = await supabaseClient
    .from('applications')
    .select('id')
    .eq('driver_id', driverId)
    .single()

  if (existingApp) {
    // Update existing application
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) {
      updateData.status = mapTenstreetStatus(status)
    }

    if (personalData) {
      Object.assign(updateData, mapPersonalData(personalData))
    }

    const { data, error } = await supabaseClient
      .from('applications')
      .update(updateData)
      .eq('id', existingApp.id)
      .select()

    if (error) {
      console.error('Error updating application:', error)
      throw error
    }

    console.log('Updated application:', data[0]?.id)
    return { action: 'updated', applicationId: data[0]?.id }

  } else if (eventType === 'new_applicant' || eventType === 'applicant_created') {
    // Create new application from webhook
    const insertData = {
      driver_id: driverId,
      source: 'Tenstreet',
      status: mapTenstreetStatus(status),
      applied_at: new Date().toISOString(),
      ...mapPersonalData(personalData),
      ...mapApplicationData(applicationData)
    }

    const { data, error } = await supabaseClient
      .from('applications')
      .insert(insertData)
      .select()

    if (error) {
      console.error('Error creating application:', error)
      throw error
    }

    console.log('Created application:', data[0]?.id)
    return { action: 'created', applicationId: data[0]?.id }
  }

  return { action: 'ignored', reason: 'No matching application and not a new applicant event' }
}

function parseWebhookXML(xmlText: string) {
  return {
    eventType: extractXMLTag(xmlText, 'EventType') || 'status_update',
    driverId: extractXMLTag(xmlText, 'DriverId'),
    status: extractXMLTag(xmlText, 'Status'),
    personalData: {
      firstName: extractXMLTag(xmlText, 'GivenName'),
      lastName: extractXMLTag(xmlText, 'FamilyName'),
      email: extractXMLTag(xmlText, 'InternetEmailAddress'),
      phone: extractXMLTag(xmlText, 'PrimaryPhone'),
      city: extractXMLTag(xmlText, 'Municipality'),
      state: extractXMLTag(xmlText, 'Region'),
      zip: extractXMLTag(xmlText, 'PostalCode')
    },
    applicationData: {
      cdl: extractCustomQuestion(xmlText, 'cdl_class'),
      experience: extractCustomQuestion(xmlText, 'experience')
    }
  }
}

function mapPersonalData(personalData: any) {
  if (!personalData) return {}
  
  return {
    first_name: personalData.firstName,
    last_name: personalData.lastName,
    applicant_email: personalData.email,
    phone: personalData.phone,
    city: personalData.city,
    state: personalData.state,
    zip: personalData.zip
  }
}

function mapApplicationData(applicationData: any) {
  if (!applicationData) return {}
  
  return {
    cdl: applicationData.cdl,
    exp: applicationData.experience
  }
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
  }
  
  return statusMap[tenstreetStatus?.toLowerCase()] || tenstreetStatus || 'pending'
}

function extractXMLTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'i'))
  return match ? match[1] : null
}

function extractCustomQuestion(xml: string, questionId: string): string | null {
  const questionMatch = xml.match(
    new RegExp(`<CustomQuestion>.*?<QuestionId>${questionId}</QuestionId>.*?<Answer>(.*?)</Answer>.*?</CustomQuestion>`, 'is')
  )
  return questionMatch ? questionMatch[1] : null
}
