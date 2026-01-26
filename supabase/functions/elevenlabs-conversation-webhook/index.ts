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

const logger = createLogger('elevenlabs-conversation-webhook');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-elevenlabs-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper to extract values from ElevenLabs data_collection_results
function getValue(dataCollectionResults: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const val = dataCollectionResults[key];
    if (val !== undefined && val !== null) {
      if (typeof val === 'object') {
        const objVal = val as Record<string, unknown>;
        return String(objVal.value || objVal.answer || objVal.text || JSON.stringify(val)).trim();
      }
      return String(val).trim();
    }
  }
  return undefined;
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
    // Only accept POST requests
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

    // Parse webhook payload
    const payload: ElevenLabsWebhookPayload = await req.json();
    
    logger.info('Received webhook', {
      conversationId: payload.conversation_id,
      agentId: payload.agent_id,
      status: payload.status,
    });

    // Validate required fields
    if (!payload.conversation_id || !payload.agent_id) {
      logger.error('Missing required fields', { payload });
      return new Response(
        JSON.stringify({ success: false, error: 'Missing conversation_id or agent_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Look up the voice agent by ElevenLabs agent ID
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
      // Still return 200 to prevent ElevenLabs from retrying
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

    // Extract applicant information
    const firstName = getValue(dataCollectionResults, ['GivenName', 'first_name', 'FirstName', 'given_name']);
    const lastName = getValue(dataCollectionResults, ['FamilyName', 'last_name', 'LastName', 'family_name']);
    const email = getValue(dataCollectionResults, ['InternetEmailAddress', 'email', 'Email', 'email_address']);
    const phone = getValue(dataCollectionResults, ['PrimaryPhone', 'phone', 'Phone', 'PhoneNumber', 'phone_number']);
    const zip = getValue(dataCollectionResults, ['PostalCode', 'zip', 'Zip', 'ZipCode', 'postal_code']);

    // Require at least email or phone to create application
    if (!email && !phone) {
      logger.info('Skipping - no contact info', { conversationId: payload.conversation_id });
      
      // Still log the conversation for reference
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

    // Format transcript
    const formattedTranscript = transcript
      .map((entry) => `${entry.role === 'agent' ? 'Agent' : 'Caller'}: ${entry.message}`)
      .join('\n');

    const transcriptParts: string[] = [];
    if (transcriptSummary) {
      transcriptParts.push(`=== Summary ===\n${transcriptSummary}`);
    }
    if (formattedTranscript) {
      transcriptParts.push(`=== Full Transcript ===\n${formattedTranscript}`);
    }

    // Build call metadata for notes
    const callDuration = payload.call_duration_secs;
    const callStatus = payload.status;
    const callMetadata = [
      `Conversation ID: ${payload.conversation_id}`,
      callDuration ? `Call Duration: ${Math.floor(callDuration / 60)}m ${Math.round(callDuration % 60)}s` : null,
      callStatus ? `Call Status: ${callStatus}` : null,
      `Source: Real-time webhook`,
    ].filter(Boolean).join('\n');

    // Find appropriate job listing
    let jobListingId: string | null = null;

    // First, try client-specific job listing
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

    // Fallback to any active job for the organization
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

    // Create the application
    const applicationData = {
      first_name: firstName,
      last_name: lastName,
      full_name: firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName,
      applicant_email: email,
      phone: phone,
      zip: zip,
      cdl: getValue(dataCollectionResults, ['Class_A_CDL', 'cdl', 'has_cdl']),
      exp: getValue(dataCollectionResults, ['Class_A_CDL_Experience', 'experience', 'years_experience']),
      driver_type: getValue(dataCollectionResults, ['DriverType', 'driver_type']),
      drug: getValue(dataCollectionResults, ['CanPassDrug', 'drug', 'drug_test']),
      veteran: getValue(dataCollectionResults, ['Veteran_Status', 'veteran', 'is_veteran']),
      consent: getValue(dataCollectionResults, ['consentGiven', 'consent']),
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

    // Also log to elevenlabs_conversations for tracking
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
      contact: email || phone,
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
