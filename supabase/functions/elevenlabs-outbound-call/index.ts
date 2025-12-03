import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OutboundCallRequest {
  application_id?: string;
  outbound_call_id?: string; // For processing queued calls
  voice_agent_id?: string;
  phone_number?: string;
  first_message_override?: string;
}

interface ElevenLabsOutboundResponse {
  call_sid: string;
  conversation_id?: string;
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');

    if (!elevenLabsApiKey) {
      console.error('ELEVENLABS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: OutboundCallRequest = await req.json();
    
    console.log('Outbound call request:', JSON.stringify(body));

    let applicationId = body.application_id;
    let voiceAgentId = body.voice_agent_id;
    let phoneNumber = body.phone_number;
    let outboundCallId = body.outbound_call_id;
    let metadata: Record<string, unknown> = {};

    // If processing a queued call, fetch the details
    if (outboundCallId) {
      const { data: queuedCall, error: queueError } = await supabase
        .from('outbound_calls')
        .select('*')
        .eq('id', outboundCallId)
        .eq('status', 'queued')
        .single();

      if (queueError || !queuedCall) {
        console.error('Queued call not found:', queueError);
        return new Response(
          JSON.stringify({ error: 'Queued call not found or already processed' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      applicationId = queuedCall.application_id;
      voiceAgentId = queuedCall.voice_agent_id;
      phoneNumber = queuedCall.phone_number;
      metadata = queuedCall.metadata || {};
    }

    // Validate required fields
    if (!phoneNumber && !applicationId) {
      return new Response(
        JSON.stringify({ error: 'Either phone_number or application_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If we have an application_id but no phone, fetch the application
    let application = null;
    if (applicationId) {
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select('id, phone, first_name, last_name, job_listing_id')
        .eq('id', applicationId)
        .single();

      if (appError || !appData) {
        console.error('Application not found:', appError);
        return new Response(
          JSON.stringify({ error: 'Application not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      application = appData;
      phoneNumber = phoneNumber || application.phone;
      metadata.applicant_name = `${application.first_name || ''} ${application.last_name || ''}`.trim();
    }

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'No phone number available for this application' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize phone number (US format)
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get organization ID from application's job listing
    let organizationId: string | null = null;
    if (application?.job_listing_id) {
      const { data: jobListing } = await supabase
        .from('job_listings')
        .select('organization_id')
        .eq('id', application.job_listing_id)
        .single();
      
      organizationId = jobListing?.organization_id || null;
    }

    // Find voice agent if not specified
    if (!voiceAgentId && organizationId) {
      const { data: voiceAgent } = await supabase
        .from('voice_agents')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('is_outbound_enabled', true)
        .eq('status', 'active')
        .not('agent_phone_number_id', 'is', null)
        .limit(1)
        .single();

      voiceAgentId = voiceAgent?.id;
    }

    if (!voiceAgentId) {
      return new Response(
        JSON.stringify({ error: 'No outbound-enabled voice agent found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch voice agent details
    const { data: voiceAgent, error: agentError } = await supabase
      .from('voice_agents')
      .select('*')
      .eq('id', voiceAgentId)
      .single();

    if (agentError || !voiceAgent) {
      console.error('Voice agent not found:', agentError);
      return new Response(
        JSON.stringify({ error: 'Voice agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!voiceAgent.agent_phone_number_id) {
      return new Response(
        JSON.stringify({ error: 'Voice agent does not have a phone number configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limiting - max 1 call per application per hour
    if (applicationId) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentCalls } = await supabase
        .from('outbound_calls')
        .select('id')
        .eq('application_id', applicationId)
        .gte('created_at', oneHourAgo)
        .neq('status', 'queued');

      if (recentCalls && recentCalls.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded - only 1 call per application per hour' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create or update outbound call record
    let callRecord;
    if (outboundCallId) {
      // Update existing queued call
      const { data: updated, error: updateError } = await supabase
        .from('outbound_calls')
        .update({ status: 'initiating', updated_at: new Date().toISOString() })
        .eq('id', outboundCallId)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update call record:', updateError);
      }
      callRecord = updated;
    } else {
      // Create new call record
      const { data: newCall, error: insertError } = await supabase
        .from('outbound_calls')
        .insert({
          application_id: applicationId,
          voice_agent_id: voiceAgentId,
          organization_id: organizationId || voiceAgent.organization_id,
          phone_number: normalizedPhone,
          status: 'initiating',
          metadata: {
            ...metadata,
            triggered_by: 'api_call'
          }
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create call record:', insertError);
      }
      callRecord = newCall;
    }

    // Build first message with applicant context
    let firstMessage = body.first_message_override;
    if (!firstMessage && metadata.applicant_name) {
      firstMessage = `Hello${metadata.applicant_name ? `, ${metadata.applicant_name}` : ''}! This is a follow-up call regarding your recent job application. How are you today?`;
    }

    // Make ElevenLabs outbound call API request
    console.log('Initiating ElevenLabs outbound call to:', normalizedPhone);
    
    const elevenLabsPayload: Record<string, unknown> = {
      agent_id: voiceAgent.elevenlabs_agent_id,
      agent_phone_number_id: voiceAgent.agent_phone_number_id,
      to_number: `+1${normalizedPhone}`, // Assuming US numbers
    };

    if (firstMessage) {
      elevenLabsPayload.first_message = firstMessage;
    }

    const elevenLabsResponse = await fetch(
      'https://api.elevenlabs.io/v1/convai/twilio/outbound_call',
      {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(elevenLabsPayload),
      }
    );

    const responseText = await elevenLabsResponse.text();
    console.log('ElevenLabs response status:', elevenLabsResponse.status);
    console.log('ElevenLabs response:', responseText);

    if (!elevenLabsResponse.ok) {
      // Update call record with failure
      if (callRecord) {
        await supabase
          .from('outbound_calls')
          .update({
            status: 'failed',
            error_message: `ElevenLabs API error: ${responseText}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', callRecord.id);
      }

      return new Response(
        JSON.stringify({ 
          error: 'Failed to initiate outbound call',
          details: responseText 
        }),
        { status: elevenLabsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let elevenLabsData: ElevenLabsOutboundResponse;
    try {
      elevenLabsData = JSON.parse(responseText);
    } catch {
      elevenLabsData = { call_sid: 'unknown', status: 'initiated' };
    }

    // Update call record with success
    if (callRecord) {
      await supabase
        .from('outbound_calls')
        .update({
          status: 'initiated',
          call_sid: elevenLabsData.call_sid,
          elevenlabs_conversation_id: elevenLabsData.conversation_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', callRecord.id);
    }

    console.log('Outbound call initiated successfully:', elevenLabsData);

    return new Response(
      JSON.stringify({
        success: true,
        call_id: callRecord?.id,
        call_sid: elevenLabsData.call_sid,
        conversation_id: elevenLabsData.conversation_id,
        phone_number: normalizedPhone,
        message: 'Outbound call initiated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in elevenlabs-outbound-call:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Normalize US phone number to 10 digits
function normalizePhoneNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  
  // Handle 11-digit numbers starting with 1
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.substring(1);
  }
  
  // Valid 10-digit US number
  if (digits.length === 10) {
    return digits;
  }
  
  return null;
}