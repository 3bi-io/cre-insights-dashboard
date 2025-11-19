import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookRequest {
  application_id: string;
  event_type: 'created' | 'updated' | 'deleted';
  test_mode?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { application_id, event_type, test_mode = false }: WebhookRequest = await req.json();

    console.log('[CLIENT-WEBHOOK] Processing:', { application_id, event_type, test_mode });

    // Fetch application with related data
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        *,
        job_listing:job_listings (
          id,
          title,
          job_id,
          client_id,
          organization_id,
          client:clients (
            id,
            name,
            company
          )
        ),
        recruiter:recruiters (
          id,
          name,
          email
        )
      `)
      .eq('id', application_id)
      .single();

    if (appError || !application) {
      console.error('[CLIENT-WEBHOOK] Application not found:', appError);
      return new Response(
        JSON.stringify({ error: 'Application not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const client_id = application.job_listing?.client_id;
    
    if (!client_id) {
      console.log('[CLIENT-WEBHOOK] No client associated with this application');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No client webhook configured (no client assigned)' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch webhook configuration for this client
    const { data: webhook, error: webhookError } = await supabase
      .from('client_webhooks')
      .select('*')
      .eq('client_id', client_id)
      .single();

    if (webhookError || !webhook) {
      console.log('[CLIENT-WEBHOOK] No webhook configured for client:', client_id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No webhook configured for this client' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if webhook is enabled (skip in test mode)
    if (!test_mode && !webhook.enabled) {
      console.log('[CLIENT-WEBHOOK] Webhook disabled for client:', client_id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Webhook is disabled for this client' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this event type should be sent
    if (!test_mode && webhook.event_types && !webhook.event_types.includes(event_type)) {
      console.log('[CLIENT-WEBHOOK] Event type not configured:', event_type);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Event type '${event_type}' not configured for this webhook` 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare webhook payload
    const webhookPayload = {
      event_type: test_mode ? 'test' : event_type,
      timestamp: new Date().toISOString(),
      test_mode,
      client: {
        id: application.job_listing.client.id,
        name: application.job_listing.client.name,
        company: application.job_listing.client.company,
      },
      job_listing: {
        id: application.job_listing.id,
        title: application.job_listing.title,
        job_id: application.job_listing.job_id,
      },
      application: {
        id: application.id,
        first_name: application.first_name,
        last_name: application.last_name,
        email: application.applicant_email,
        phone: application.phone,
        city: application.city,
        state: application.state,
        zip: application.zip,
        status: application.status,
        cdl: application.cdl,
        cdl_class: application.cdl_class,
        cdl_state: application.cdl_state,
        exp: application.exp,
        experience: application.driving_experience_years,
        work_authorization: application.work_authorization,
        education_level: application.education_level,
        veteran: application.veteran,
        source: application.source,
        notes: application.notes,
        applied_at: application.applied_at,
        created_at: application.created_at,
        recruiter: application.recruiter ? {
          id: application.recruiter.id,
          name: application.recruiter.name,
          email: application.recruiter.email,
        } : null,
      },
    };

    // Calculate HMAC signature if secret key is provided
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'TruckingATS-ClientWebhook/1.0',
    };

    if (webhook.secret_key) {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(webhook.secret_key);
      const messageData = encoder.encode(JSON.stringify(webhookPayload));
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
      const signatureHex = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      headers['X-Webhook-Signature'] = `sha256=${signatureHex}`;
    }

    // Send webhook request
    const startTime = Date.now();
    let response: Response;
    let responseBody: string = '';
    let errorMessage: string | null = null;

    try {
      console.log('[CLIENT-WEBHOOK] Sending to:', webhook.webhook_url);
      
      response = await fetch(webhook.webhook_url, {
        method: 'POST',
        headers,
        body: JSON.stringify(webhookPayload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      responseBody = await response.text();
      console.log('[CLIENT-WEBHOOK] Response:', response.status, responseBody.substring(0, 200));

    } catch (error) {
      console.error('[CLIENT-WEBHOOK] Request failed:', error);
      errorMessage = error.message;
      response = new Response('', { status: 0 });
    }

    const duration = Date.now() - startTime;

    // Log the webhook attempt
    const { error: logError } = await supabase
      .from('client_webhook_logs')
      .insert({
        webhook_id: webhook.id,
        application_id: application.id,
        event_type: test_mode ? 'test' : event_type,
        request_payload: webhookPayload,
        response_status: response.status,
        response_body: responseBody.substring(0, 1000), // Limit to 1000 chars
        error_message: errorMessage,
        duration_ms: duration,
      });

    if (logError) {
      console.error('[CLIENT-WEBHOOK] Failed to log webhook:', logError);
    }

    // Update webhook status
    const updateData: any = {
      last_triggered_at: new Date().toISOString(),
    };

    if (response.status >= 200 && response.status < 300) {
      updateData.last_success_at = new Date().toISOString();
      updateData.last_error = null;
    } else {
      updateData.last_error = errorMessage || `HTTP ${response.status}: ${responseBody.substring(0, 200)}`;
    }

    await supabase
      .from('client_webhooks')
      .update(updateData)
      .eq('id', webhook.id);

    // Return response
    if (response.status >= 200 && response.status < 300) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Webhook sent successfully',
          webhook_id: webhook.id,
          duration_ms: duration,
          test_mode,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage || `Webhook failed with status ${response.status}`,
          webhook_id: webhook.id,
          duration_ms: duration,
          response_status: response.status,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[CLIENT-WEBHOOK] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
