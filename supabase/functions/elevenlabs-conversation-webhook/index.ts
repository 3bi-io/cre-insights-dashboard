/**
 * ElevenLabs Conversation Webhook
 * 
 * Real-time webhook endpoint called by ElevenLabs when a conversation ends.
 * Creates applications immediately instead of relying on periodic polling.
 * 
 * Webhook URL format:
 * https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/elevenlabs-conversation-webhook
 * 
 * ElevenLabs webhook payload includes:
 * - conversation_id: Unique identifier for the conversation
 * - agent_id: The ElevenLabs agent ID
 * - status: Conversation status (e.g., 'done', 'failed')
 * - analysis: Contains data_collection_results, transcript_summary
 * - transcript: Array of conversation messages
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { createLogger } from "../_shared/logger.ts";
import { normalizeSpokenEmail, isValidEmail } from "../_shared/email-utils.ts";
import { lookupCityState } from "../_shared/zip-lookup.ts";
import { extractFromTranscript } from "../_shared/transcript-parser.ts";
import { normalizePhone } from "../_shared/phone-utils.ts";

const logger = createLogger('elevenlabs-conversation-webhook');

// Deduplication window
const DEDUP_WINDOW_HOURS = 24;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-elevenlabs-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper to extract values from ElevenLabs data_collection_results
function getValue(
  dataCollectionResults: Record<string, unknown>, 
  keys: string[],
  options?: { normalizeEmail?: boolean }
): string | undefined {
  for (const key of keys) {
    const val = dataCollectionResults[key];
    if (val !== undefined && val !== null) {
      let result: string;
      
      if (typeof val === 'object') {
        const objVal = val as Record<string, unknown>;
        const extractedValue = objVal.value ?? objVal.answer ?? objVal.text;
        if (extractedValue === null || extractedValue === undefined) {
          continue;
        }
        result = String(extractedValue).trim();
      } else {
        result = String(val).trim();
      }
      
      if (options?.normalizeEmail) {
        const normalized = normalizeSpokenEmail(result);
        if (normalized && isValidEmail(normalized)) {
          return normalized;
        }
        if (isValidEmail(result)) {
          return result.toLowerCase();
        }
        continue;
      }
      
      return result;
    }
  }
  return undefined;
}

/**
 * Check if a duplicate application exists within the dedup window
 */
async function isDuplicate(
  supabase: ReturnType<typeof createClient>,
  email: string | undefined,
  phone: string | null,
  jobListingId: string | null,
): Promise<{ isDup: boolean; existingId?: string }> {
  if (!email && !phone) return { isDup: false };

  const cutoff = new Date(Date.now() - DEDUP_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  if (email) {
    let query = supabase
      .from('applications')
      .select('id')
      .eq('applicant_email', email)
      .gte('created_at', cutoff)
      .limit(1)
      .maybeSingle();

    if (jobListingId) {
      query = query.eq('job_listing_id', jobListingId);
    }

    const { data } = await query;
    if (data) return { isDup: true, existingId: data.id };
  }

  if (phone) {
    let query = supabase
      .from('applications')
      .select('id')
      .eq('phone', phone)
      .gte('created_at', cutoff)
      .limit(1)
      .maybeSingle();

    if (jobListingId) {
      query = query.eq('job_listing_id', jobListingId);
    }

    const { data } = await query;
    if (data) return { isDup: true, existingId: data.id };
  }

  return { isDup: false };
}

interface ElevenLabsWebhookPayload {
  conversation_id: string;
  agent_id: string;
  status?: string;
  call_duration_secs?: number;
  start_time?: string;
  end_time?: string;
  analysis?: {
    data_collection_results?: Record<string, unknown>;
    transcript_summary?: string;
  };
  transcript?: Array<{
    role: string;
    message: string;
  }>;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const payload: ElevenLabsWebhookPayload = await req.json();
    
    logger.info('Received webhook', {
      conversationId: payload.conversation_id,
      agentId: payload.agent_id,
      status: payload.status,
    });

    if (!payload.conversation_id || !payload.agent_id) {
      logger.error('Missing required fields', { payload });
      return new Response(
        JSON.stringify({ success: false, error: 'Missing conversation_id or agent_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Look up the voice agent
    const { data: voiceAgent, error: agentError } = await supabase
      .from('voice_agents')
      .select('id, agent_name, organization_id, client_id, is_active')
      .eq('elevenlabs_agent_id', payload.agent_id)
      .maybeSingle();

    if (agentError) {
      logger.error('Failed to fetch voice agent', agentError);
      return new Response(
        JSON.stringify({ success: false, error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!voiceAgent) {
      logger.warn('Unknown agent ID received', { agentId: payload.agent_id });
      return new Response(
        JSON.stringify({ success: true, message: 'Agent not configured in system' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if application already exists for this conversation
    const { data: existingApp } = await supabase
      .from('applications')
      .select('id')
      .eq('source', 'ElevenLabs')
      .ilike('notes', `%Conversation ID: ${payload.conversation_id}%`)
      .maybeSingle();

    if (existingApp) {
      logger.info('Application already exists', { 
        conversationId: payload.conversation_id, 
        applicationId: existingApp.id 
      });
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Application already exists',
          application_id: existingApp.id 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract data from the webhook payload
    const dataCollectionResults = payload.analysis?.data_collection_results || {};
    const transcript = payload.transcript || [];
    const transcriptSummary = payload.analysis?.transcript_summary;

    // Format transcript for fallback parsing  
    const formattedTranscript = transcript
      .map((entry) => `${entry.role === 'agent' ? 'Agent' : 'Caller'}: ${entry.message}`)
      .join('\n');

    const fallbackData = extractFromTranscript(formattedTranscript);

    // Extract applicant information
    const firstName = getValue(dataCollectionResults, ['GivenName', 'first_name', 'FirstName', 'given_name', 'firstName', 'name', 'caller_first_name']);
    const lastName = getValue(dataCollectionResults, ['FamilyName', 'last_name', 'LastName', 'family_name', 'lastName', 'caller_last_name']);
    const emailFromData = getValue(dataCollectionResults, ['InternetEmailAddress', 'email', 'Email', 'email_address', 'emailAddress', 'caller_email'], { normalizeEmail: true });
    const rawPhone = getValue(dataCollectionResults, ['PrimaryPhone', 'phone', 'Phone', 'PhoneNumber', 'phone_number', 'phoneNumber', 'cell', 'mobile', 'caller_phone']);
    const zipFromData = getValue(dataCollectionResults, ['PostalCode', 'zip', 'Zip', 'ZipCode', 'postal_code', 'postalCode', 'zipCode']);

    // Use data_collection_results first, fall back to transcript extraction
    const email = emailFromData || fallbackData.email;
    const zip = zipFromData || fallbackData.zip;

    // Normalize phone - handle spoken digits
    const phoneRaw = rawPhone || fallbackData.phone;
    const normalizedPhone = normalizePhone(phoneRaw);

    // Lookup city/state from ZIP code
    const { city, state } = await lookupCityState(zip);

    // Require at least email or phone
    if (!email && !normalizedPhone) {
      logger.info('Skipping - no contact info', { conversationId: payload.conversation_id });
      
      await supabase.from('elevenlabs_conversations').upsert({
        conversation_id: payload.conversation_id,
        agent_id: payload.agent_id,
        voice_agent_id: voiceAgent.id,
        organization_id: voiceAgent.organization_id,
        status: payload.status || 'done',
        started_at: payload.start_time,
        ended_at: payload.end_time || new Date().toISOString(),
        duration_seconds: payload.call_duration_secs,
        metadata: {
          source: 'webhook',
          no_contact_info: true,
          data_collection_results: dataCollectionResults,
        },
      }, {
        onConflict: 'conversation_id',
        ignoreDuplicates: false,
      });

      return new Response(
        JSON.stringify({ success: true, message: 'No contact info collected' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find appropriate job listing
    let jobListingId: string | null = null;

    if (voiceAgent.client_id) {
      const { data: clientJob } = await supabase
        .from('job_listings')
        .select('id')
        .eq('organization_id', voiceAgent.organization_id)
        .eq('client_id', voiceAgent.client_id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (clientJob) {
        jobListingId = clientJob.id;
      }
    }

    if (!jobListingId) {
      const { data: fallbackJob } = await supabase
        .from('job_listings')
        .select('id')
        .eq('organization_id', voiceAgent.organization_id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (fallbackJob) {
        jobListingId = fallbackJob.id;
      }
    }

    if (!jobListingId) {
      logger.warn('No job listing found for agent', { 
        agentId: payload.agent_id,
        organizationId: voiceAgent.organization_id 
      });
    }

    // Deduplication check - skip if same email/phone applied recently
    const { isDup, existingId } = await isDuplicate(supabase, email, normalizedPhone, jobListingId);
    if (isDup) {
      logger.info('Skipping duplicate application', {
        conversationId: payload.conversation_id,
        existingApplicationId: existingId,
        contact: email || normalizedPhone,
      });

      // Still log the conversation
      await supabase.from('elevenlabs_conversations').upsert({
        conversation_id: payload.conversation_id,
        agent_id: payload.agent_id,
        voice_agent_id: voiceAgent.id,
        organization_id: voiceAgent.organization_id,
        status: payload.status || 'done',
        started_at: payload.start_time,
        ended_at: payload.end_time || new Date().toISOString(),
        duration_seconds: payload.call_duration_secs,
        metadata: {
          source: 'webhook',
          duplicate_of: existingId,
          data_collection_results: dataCollectionResults,
        },
      }, {
        onConflict: 'conversation_id',
        ignoreDuplicates: false,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Duplicate application skipped',
          existing_application_id: existingId,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const transcriptParts: string[] = [];
    if (transcriptSummary) {
      transcriptParts.push(`=== Summary ===\n${transcriptSummary}`);
    }
    if (formattedTranscript) {
      transcriptParts.push(`=== Full Transcript ===\n${formattedTranscript}`);
    }

    const callDuration = payload.call_duration_secs;
    const callStatus = payload.status;
    const callMetadata = [
      `Conversation ID: ${payload.conversation_id}`,
      callDuration ? `Call Duration: ${Math.floor(callDuration / 60)}m ${Math.round(callDuration % 60)}s` : null,
      callStatus ? `Call Status: ${callStatus}` : null,
      `Source: Real-time webhook`,
    ].filter(Boolean).join('\n');

    // CDL and qualification fields
    const cdlValue = getValue(dataCollectionResults, ['Class_A_CDL', 'cdl', 'has_cdl', 'CDL', 'cdl_status', 'hasCDL', 'class_a_cdl']) || fallbackData.cdl;
    const expValue = getValue(dataCollectionResults, ['Class_A_CDL_Experience', 'experience', 'exp', 'months_experience', 'driving_experience', 'cdl_experience', 'experienceMonths']) || fallbackData.exp;
    const drugValue = getValue(dataCollectionResults, ['CanPassDrug', 'drug', 'drug_test', 'can_pass_drug_test', 'drugTest', 'passedDrugTest']) || fallbackData.drug;
    const veteranValue = getValue(dataCollectionResults, ['Veteran_Status', 'veteran', 'is_veteran', 'military', 'served_military', 'veteranStatus']) || fallbackData.veteran;
    const consentValue = getValue(dataCollectionResults, ['consentGiven', 'consent', 'privacy_consent', 'agreed_privacy', 'privacyPolicy']) || fallbackData.consent;
    const over21Value = getValue(dataCollectionResults, ['Over21', 'over_21', 'AgeVerification', 'is_over_21', 'age_verified', 'atLeast21']) || fallbackData.over_21;
    const driverTypeValue = getValue(dataCollectionResults, ['DriverType', 'driver_type', 'driverType', 'employment_type', 'position_type']) || fallbackData.driver_type;

    const applicationData = {
      first_name: firstName,
      last_name: lastName,
      full_name: firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName,
      applicant_email: email,
      phone: normalizedPhone || rawPhone,
      zip: zip,
      city: city || undefined,
      state: state || undefined,
      cdl: cdlValue,
      exp: expValue,
      driver_type: driverTypeValue,
      drug: drugValue,
      veteran: veteranValue,
      consent: consentValue,
      over_21: over21Value,
      can_pass_drug_test: drugValue,
      hazmat_endorsement: getValue(dataCollectionResults, ['Hazmat', 'hazmat_endorsement', 'HazmatEndorsement', 'hazmat', 'hasHazmat']),
      work_authorization: getValue(dataCollectionResults, ['WorkAuthorization', 'work_authorization', 'workAuthorization', 'authorized_to_work']),
      cdl_class: getValue(dataCollectionResults, ['CDLClass', 'cdl_class', 'LicenseClass', 'license_class', 'cdlClass']),
      source: 'ElevenLabs',
      job_listing_id: jobListingId,
      elevenlabs_call_transcript: transcriptParts.join('\n\n') || null,
      notes: `--- ElevenLabs Voice Application ---\n${callMetadata}\nAgent: ${voiceAgent.agent_name}`,
      status: 'pending',
      applied_at: payload.start_time || new Date().toISOString(),
    };

    const { data: newApplication, error: insertError } = await supabase
      .from('applications')
      .insert(applicationData)
      .select('id')
      .single();

    if (insertError) {
      logger.error('Failed to create application', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create application' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log to elevenlabs_conversations
    await supabase.from('elevenlabs_conversations').upsert({
      conversation_id: payload.conversation_id,
      agent_id: payload.agent_id,
      voice_agent_id: voiceAgent.id,
      organization_id: voiceAgent.organization_id,
      status: payload.status || 'done',
      started_at: payload.start_time,
      ended_at: payload.end_time || new Date().toISOString(),
      duration_seconds: payload.call_duration_secs,
      metadata: {
        source: 'webhook',
        application_id: newApplication.id,
        data_collection_results: dataCollectionResults,
      },
    }, {
      onConflict: 'conversation_id',
      ignoreDuplicates: false,
    });

    const duration = Date.now() - startTime;
    
    logger.info('Application created via webhook', {
      applicationId: newApplication.id,
      conversationId: payload.conversation_id,
      agentName: voiceAgent.agent_name,
      contact: email || normalizedPhone,
      durationMs: duration,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Application created successfully',
        application_id: newApplication.id,
        duration_ms: duration,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Webhook processing failed', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: duration,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
