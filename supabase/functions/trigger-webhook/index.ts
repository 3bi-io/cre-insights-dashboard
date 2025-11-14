/**
 * Trigger Webhook Handler
 * 
 * Tests and triggers configured webhooks.
 * Used by the webhook management UI for testing.
 * 
 * SECURITY:
 * - Validates webhook configuration exists
 * - Respects enabled status (unless test mode)
 * - Logs all attempts
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { getCorsHeaders, createSuccessResponse, createErrorResponse } from '../_shared/responses.ts';
import { wrapHandler } from '../_shared/handler-wrapper.ts';

interface TriggerWebhookRequest {
  webhook_id: string;
  test_mode?: boolean;
  payload?: Record<string, any>;
}

/**
 * Send webhook with timeout
 */
async function sendWebhook(
  url: string,
  payload: Record<string, any>
): Promise<{ success: boolean; status: number; body: string; error?: string }> {
  try {
    console.log('[TRIGGER-WEBHOOK] Sending to:', url.substring(0, 50) + '...');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Webhook-Test/1.0',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const responseBody = await response.text();

    return {
      success: response.ok,
      status: response.status,
      body: responseBody,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    console.error('[TRIGGER-WEBHOOK] Send failed:', error);
    return {
      success: false,
      status: 500,
      body: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getServiceClient();
  const startTime = Date.now();

  const { webhook_id, test_mode = false, payload = {} }: TriggerWebhookRequest = await req.json();

  if (!webhook_id) {
    return createErrorResponse('Missing required field: webhook_id', 400);
  }

  console.log('[TRIGGER-WEBHOOK] Triggering webhook', {
    webhook_id,
    test_mode,
  });

  // Fetch webhook configuration
  const { data: webhook, error: fetchError } = await supabase
    .from('webhook_configurations')
    .select('*')
    .eq('id', webhook_id)
    .single();

  if (fetchError || !webhook) {
    console.error('[TRIGGER-WEBHOOK] Webhook not found:', fetchError);
    return createErrorResponse('Webhook not found', 404);
  }

  // Check if webhook is enabled (skip check in test mode)
  if (!webhook.enabled && !test_mode) {
    console.log('[TRIGGER-WEBHOOK] Webhook is disabled');
    return createErrorResponse('Webhook is disabled', 400);
  }

  // Prepare webhook payload
  const webhookPayload = {
    timestamp: new Date().toISOString(),
    test_mode: test_mode || false,
    data: payload,
    organization_id: webhook.organization_id,
    webhook_id: webhook.id,
  };

  // Send webhook
  const result = await sendWebhook(webhook.webhook_url, webhookPayload);
  const duration_ms = Date.now() - startTime;

  // Log the webhook call
  await supabase.from('webhook_logs').insert({
    webhook_id: webhook.id,
    trigger_event: test_mode ? 'test' : 'manual',
    payload: webhookPayload,
    response_status: result.status,
    response_body: result.body.substring(0, 1000),
    error_message: result.error || null,
  });

  console.log('[TRIGGER-WEBHOOK] Result', {
    webhook_id,
    success: result.success,
    status: result.status,
    duration_ms,
  });

  if (result.success) {
    return createSuccessResponse({
      success: true,
      status: result.status,
      message: 'Webhook triggered successfully',
      duration_ms,
      response: result.body.substring(0, 500),
    });
  } else {
    return createErrorResponse(
      `Webhook failed: ${result.error}`,
      result.status >= 400 && result.status < 500 ? result.status : 500
    );
  }
};

serve(wrapHandler(handler));