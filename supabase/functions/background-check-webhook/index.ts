import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { validateBGCWebhook, BGCProvider, BGCConnection } from "../_shared/bgc-adapters/index.ts";
import { createLogger } from "../_shared/logger.ts";

const logger = createLogger('background-check-webhook');

import { getCorsHeaders } from '../_shared/cors-config.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const correlationId = crypto.randomUUID();
  const url = new URL(req.url);
  const providerSlug = url.searchParams.get("provider");

  logger.info(`Webhook received`, { correlationId, providerSlug });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (!providerSlug) {
      return new Response(JSON.stringify({ error: "provider required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.text();
    const signature = req.headers.get("x-checkr-signature") ||
      req.headers.get("x-sterling-signature") ||
      req.headers.get("x-hireright-signature") ||
      req.headers.get("x-goodhire-signature") ||
      req.headers.get("x-accurate-signature") || "";

    // Get provider config
    const { data: provider } = await supabase
      .from("background_check_providers")
      .select("*")
      .eq("slug", providerSlug)
      .single();

    if (!provider) {
      return new Response(JSON.stringify({ error: "Unknown provider" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse payload to find the request
    const parsedPayload = JSON.parse(payload);
    const externalId = parsedPayload.id || parsedPayload.orderId || parsedPayload.report_id;

    // Find the request record
    const { data: request } = await supabase
      .from("background_check_requests")
      .select("*, organization_bgc_connections(*)")
      .eq("external_id", externalId)
      .single();

    if (!request) {
      logger.info('No matching request found', { correlationId, externalId });
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const connection = request.organization_bgc_connections as unknown as BGCConnection;
    
    // Validate webhook
    const validation = validateBGCWebhook(
      providerSlug,
      payload,
      signature,
      connection.webhook_secret || "",
      provider as unknown as BGCProvider,
      connection
    );

    if (!validation.valid) {
      logger.warn('Invalid webhook signature', { correlationId });
    }

    // Update request status
    const webhookPayload = validation.payload;
    const updateData: Record<string, unknown> = {
      status: webhookPayload?.status || "processing",
      updated_at: new Date().toISOString(),
    };

    if (webhookPayload?.result) {
      updateData.result = webhookPayload.result;
    }
    if (webhookPayload?.report_url) {
      updateData.report_url = webhookPayload.report_url;
    }
    if (webhookPayload?.status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    await supabase
      .from("background_check_requests")
      .update(updateData)
      .eq("id", request.id);

    logger.info('Request updated', { correlationId, requestId: request.id, status: updateData.status });

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error('Webhook error', error, { correlationId });
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
