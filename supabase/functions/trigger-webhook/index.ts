import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createLogger } from "../_shared/logger.ts";
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';

const logger = createLogger('trigger-webhook');

serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  try {
    const supabase = getServiceClient();

    const { webhook_id, test_mode, payload } = await req.json();

    logger.info('Triggering webhook', { webhook_id, test_mode });

    // Fetch webhook configuration
    const { data: webhook, error: fetchError } = await supabase
      .from('webhook_configurations')
      .select('*')
      .eq('id', webhook_id)
      .single();

    if (fetchError || !webhook) {
      throw new Error('Webhook not found');
    }

    if (!webhook.enabled && !test_mode) {
      throw new Error('Webhook is disabled');
    }

    // Prepare webhook payload
    const webhookPayload = {
      timestamp: new Date().toISOString(),
      test_mode: test_mode || false,
      data: payload,
      organization_id: webhook.organization_id,
    };

    logger.info('Sending webhook', { url: webhook.webhook_url });

    // Send webhook
    const webhookResponse = await fetch(webhook.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    const responseStatus = webhookResponse.status;
    const responseBody = await webhookResponse.text();

    logger.apiResponse('POST', webhook.webhook_url, responseStatus);

    // Log the webhook call
    await supabase.from('webhook_logs').insert({
      webhook_id: webhook.id,
      trigger_event: 'test',
      payload: webhookPayload,
      response_status: responseStatus,
      response_body: responseBody.substring(0, 1000),
      error_message: responseStatus >= 400 ? responseBody : null,
    });

    if (responseStatus >= 400) {
      throw new Error(`Webhook failed with status ${responseStatus}: ${responseBody}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: responseStatus,
        message: 'Webhook triggered successfully',
      }),
      {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    logger.error('Webhook error', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      }
    );
  }
});
