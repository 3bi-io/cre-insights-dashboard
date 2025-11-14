/**
 * Client Webhook Handler
 * 
 * Sends application events to client-configured webhook URLs.
 * Supports test mode and event filtering.
 * 
 * SECURITY:
 * - Uses service role for webhook lookups
 * - Logs all webhook attempts for auditing
 * - Validates event types against configuration
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { wrapHandler } from '../_shared/error-handler.ts';

interface WebhookRequest {
  application_id: string;
  event_type: 'created' | 'updated' | 'deleted';
  test_mode?: boolean;
}

interface WebhookPayload {
  event_type: string;
  timestamp: string;
  application: Record<string, any>;
  job_listing?: Record<string, any>;
  client?: Record<string, any>;
}

/**
 * Send webhook with retry logic
 */
async function sendWebhookWithRetry(
  url: string,
  payload: WebhookPayload,
  secretKey: string | null,
  maxRetries = 3
): Promise<{ success: boolean; status: number; body: string; error?: string }> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[CLIENT-WEBHOOK] Sending webhook (attempt ${attempt}/${maxRetries})`, {
        url: url.substring(0, 50) + '...',
      });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Webhook/1.0',
      };

      // Add signature header if secret key is configured
      if (secretKey) {
        headers['X-Webhook-Signature'] = secretKey;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      const responseBody = await response.text();

      if (response.ok) {
        console.log(`[CLIENT-WEBHOOK] Webhook succeeded on attempt ${attempt}`);
        return {
          success: true,
          status: response.status,
          body: responseBody,
        };
      }

      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        console.warn(`[CLIENT-WEBHOOK] Webhook failed with client error ${response.status}, not retrying`);
        return {
          success: false,
          status: response.status,
          body: responseBody,
          error: `Client error: ${response.status}`,
        };
      }

      lastError = new Error(`Server error: ${response.status}`);
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`[CLIENT-WEBHOOK] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      lastError = error as Error;
      console.error(`[CLIENT-WEBHOOK] Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return {
    success: false,
    status: 500,
    body: '',
    error: lastError?.message || 'Max retries exceeded',
  };
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getServiceClient();
  const startTime = Date.now();

  // Parse request body
  const { application_id, event_type, test_mode = false }: WebhookRequest = await req.json();

  console.log('[CLIENT-WEBHOOK] Processing webhook', {
    application_id,
    event_type,
    test_mode,
  });

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
    return errorResponse('Application not found', 404, undefined, origin);
  }

  const client_id = application.job_listing?.client_id;
  
  if (!client_id) {
    console.log('[CLIENT-WEBHOOK] No client associated with application');
    return successResponse({
      success: true,
      message: 'No client webhook configured (no client assigned)',
    }, undefined, undefined, origin);
  }

  // Fetch webhook configuration for this client
  const { data: webhook, error: webhookError } = await supabase
    .from('client_webhooks')
    .select('*')
    .eq('client_id', client_id)
    .single();

  if (webhookError || !webhook) {
    console.log('[CLIENT-WEBHOOK] No webhook configured for client:', client_id);
    return successResponse({
      success: true,
      message: 'No webhook configured for this client',
    }, undefined, undefined, origin);
  }

  // Check if webhook is enabled (skip in test mode)
  if (!test_mode && !webhook.enabled) {
    console.log('[CLIENT-WEBHOOK] Webhook disabled for client:', client_id);
    return successResponse({
      success: true,
      message: 'Webhook is disabled for this client',
    }, undefined, undefined, origin);
  }

  // Check if this event type should be sent
  if (!test_mode && webhook.event_types && !webhook.event_types.includes(event_type)) {
    console.log('[CLIENT-WEBHOOK] Event type not configured:', event_type);
    return successResponse({
      success: true,
      message: `Event type '${event_type}' not configured for this webhook`,
    }, undefined, undefined, origin);
  }

  // Prepare webhook payload
  const payload: WebhookPayload = {
    event_type,
    timestamp: new Date().toISOString(),
    application: {
      id: application.id,
      first_name: application.first_name,
      last_name: application.last_name,
      email: application.applicant_email,
      phone: application.phone,
      status: application.status,
      applied_at: application.applied_at,
      cdl: application.cdl,
      cdl_class: application.cdl_class,
      exp: application.exp,
      city: application.city,
      state: application.state,
    },
    job_listing: application.job_listing ? {
      id: application.job_listing.id,
      title: application.job_listing.title,
      job_id: application.job_listing.job_id,
    } : undefined,
    client: application.job_listing?.client ? {
      id: application.job_listing.client.id,
      name: application.job_listing.client.name,
      company: application.job_listing.client.company,
    } : undefined,
  };

  // Send webhook with retry logic
  const result = await sendWebhookWithRetry(
    webhook.webhook_url,
    payload,
    webhook.secret_key
  );

  const duration_ms = Date.now() - startTime;

  // Log webhook attempt
  await supabase.from('client_webhook_logs').insert({
    webhook_id: webhook.id,
    application_id: application.id,
    event_type,
    request_payload: payload,
    response_status: result.status,
    response_body: result.body.substring(0, 5000),
    error_message: result.error || null,
    duration_ms,
  });

  // Update webhook status
  if (result.success) {
    await supabase
      .from('client_webhooks')
      .update({
        last_success_at: new Date().toISOString(),
        last_triggered_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('id', webhook.id);

    console.log('[CLIENT-WEBHOOK] Webhook sent successfully', {
      webhook_id: webhook.id,
      duration_ms,
    });

    return successResponse({
      success: true,
      message: 'Webhook sent successfully',
      duration_ms,
    }, undefined, undefined, origin);
  } else {
    await supabase
      .from('client_webhooks')
      .update({
        last_triggered_at: new Date().toISOString(),
        last_error: result.error || 'Unknown error',
      })
      .eq('id', webhook.id);

    console.error('[CLIENT-WEBHOOK] Webhook failed', {
      webhook_id: webhook.id,
      error: result.error,
      duration_ms,
    });

    return errorResponse(result.error || 'Webhook delivery failed', 500, undefined, origin);
  }
};

serve(wrapHandler(handler));
