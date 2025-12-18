import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CallStatusUpdate {
  call_sid?: string;
  conversation_id?: string;
  outbound_call_id?: string;
  status?: string;
  duration?: number;
  error_message?: string;
}

interface WebhookPayload {
  event_type: string;
  timestamp: string;
  call_id: string;
  conversation_id: string | null;
  phone_number: string;
  status: string;
  duration_seconds: number | null;
  applicant_name: string | null;
  application_id: string | null;
  organization_id: string | null;
}

// Map Twilio/ElevenLabs statuses to our status enum
function mapCallStatus(externalStatus: string): string {
  const statusMap: Record<string, string> = {
    'queued': 'queued',
    'ringing': 'ringing',
    'in-progress': 'in_progress',
    'completed': 'completed',
    'busy': 'busy',
    'no-answer': 'no_answer',
    'failed': 'failed',
    'canceled': 'cancelled',
    'cancelled': 'cancelled',
  };
  return statusMap[externalStatus.toLowerCase()] || externalStatus;
}

// Generate HMAC signature for webhook verification
async function generateHmacSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const { action } = body;

    console.log(`[elevenlabs-call-status] Action: ${action}`, JSON.stringify(body));

    // Handle webhook test
    if (action === "test_webhook") {
      const { webhook_id } = body;

      if (!webhook_id) {
        return new Response(
          JSON.stringify({ success: false, error: "webhook_id required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Get webhook config
      const { data: webhook, error: webhookError } = await supabase
        .from("call_webhooks")
        .select("*")
        .eq("id", webhook_id)
        .single();

      if (webhookError || !webhook) {
        return new Response(
          JSON.stringify({ success: false, error: "Webhook not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      // Send test payload
      const testPayload: WebhookPayload = {
        event_type: "test",
        timestamp: new Date().toISOString(),
        call_id: "test-call-id",
        conversation_id: null,
        phone_number: "+15555555555",
        status: "completed",
        duration_seconds: 120,
        applicant_name: "Test Applicant",
        application_id: null,
        organization_id: webhook.organization_id,
      };

      const payloadStr = JSON.stringify(testPayload);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (webhook.secret_key) {
        const signature = await generateHmacSignature(payloadStr, webhook.secret_key);
        headers["X-Webhook-Signature"] = signature;
      }

      try {
        const response = await fetch(webhook.webhook_url, {
          method: "POST",
          headers,
          body: payloadStr,
        });

        const responseBody = await response.text();

        // Update webhook with test result
        await supabase
          .from("call_webhooks")
          .update({
            last_triggered_at: new Date().toISOString(),
            last_success_at: response.ok ? new Date().toISOString() : null,
            last_error: response.ok ? null : `Status ${response.status}: ${responseBody.slice(0, 200)}`,
          })
          .eq("id", webhook_id);

        return new Response(
          JSON.stringify({
            success: response.ok,
            status: response.status,
            error: response.ok ? null : responseBody.slice(0, 200),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (fetchError) {
        await supabase
          .from("call_webhooks")
          .update({
            last_triggered_at: new Date().toISOString(),
            last_error: fetchError.message,
          })
          .eq("id", webhook_id);

        return new Response(
          JSON.stringify({ success: false, error: fetchError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Handle call status update (from Twilio/ElevenLabs callback)
    if (action === "update_status" || !action) {
      const statusUpdate: CallStatusUpdate = body;
      
      // Find the outbound call record
      let query = supabase.from("outbound_calls").select("*");

      if (statusUpdate.outbound_call_id) {
        query = query.eq("id", statusUpdate.outbound_call_id);
      } else if (statusUpdate.call_sid) {
        query = query.eq("call_sid", statusUpdate.call_sid);
      } else if (statusUpdate.conversation_id) {
        query = query.eq("elevenlabs_conversation_id", statusUpdate.conversation_id);
      } else {
        return new Response(
          JSON.stringify({ success: false, error: "No identifier provided" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const { data: call, error: callError } = await query.single();

      if (callError || !call) {
        console.error("[elevenlabs-call-status] Call not found:", callError);
        return new Response(
          JSON.stringify({ success: false, error: "Call not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      const mappedStatus = statusUpdate.status ? mapCallStatus(statusUpdate.status) : call.status;
      const isTerminalStatus = ["completed", "failed", "no_answer", "busy", "cancelled"].includes(mappedStatus);

      // Update the outbound call record
      const updateData: Record<string, unknown> = {
        status: mappedStatus,
        updated_at: new Date().toISOString(),
      };

      if (statusUpdate.duration) {
        updateData.duration_seconds = statusUpdate.duration;
      }

      if (statusUpdate.error_message) {
        updateData.error_message = statusUpdate.error_message;
      }

      if (isTerminalStatus && !call.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("outbound_calls")
        .update(updateData)
        .eq("id", call.id);

      if (updateError) {
        console.error("[elevenlabs-call-status] Update error:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: updateError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      // If terminal status, trigger webhooks
      if (isTerminalStatus) {
        // Fetch enabled webhooks for this organization that match the event type
        const { data: webhooks } = await supabase
          .from("call_webhooks")
          .select("*")
          .eq("organization_id", call.organization_id)
          .eq("enabled", true)
          .contains("event_types", [mappedStatus]);

        console.log(`[elevenlabs-call-status] Found ${webhooks?.length || 0} webhooks to trigger`);

        // Get application details if available
        let applicantName = call.metadata?.applicant_name || null;
        if (call.application_id && !applicantName) {
          const { data: app } = await supabase
            .from("applications")
            .select("first_name, last_name")
            .eq("id", call.application_id)
            .single();
          
          if (app) {
            applicantName = `${app.first_name || ""} ${app.last_name || ""}`.trim() || null;
          }
        }

        // Trigger each webhook
        for (const webhook of webhooks || []) {
          const payload: WebhookPayload = {
            event_type: mappedStatus,
            timestamp: new Date().toISOString(),
            call_id: call.id,
            conversation_id: call.elevenlabs_conversation_id,
            phone_number: call.phone_number,
            status: mappedStatus,
            duration_seconds: statusUpdate.duration || call.duration_seconds,
            applicant_name: applicantName,
            application_id: call.application_id,
            organization_id: call.organization_id,
          };

          const payloadStr = JSON.stringify(payload);
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };

          if (webhook.secret_key) {
            const signature = await generateHmacSignature(payloadStr, webhook.secret_key);
            headers["X-Webhook-Signature"] = signature;
          }

          const startTime = Date.now();
          let responseStatus: number | null = null;
          let responseBody: string | null = null;
          let errorMessage: string | null = null;

          try {
            const response = await fetch(webhook.webhook_url, {
              method: "POST",
              headers,
              body: payloadStr,
            });

            responseStatus = response.status;
            responseBody = await response.text();

            // Update webhook status
            await supabase
              .from("call_webhooks")
              .update({
                last_triggered_at: new Date().toISOString(),
                last_success_at: response.ok ? new Date().toISOString() : webhook.last_success_at,
                last_error: response.ok ? null : `Status ${response.status}`,
              })
              .eq("id", webhook.id);
          } catch (fetchError) {
            errorMessage = fetchError.message;
            
            await supabase
              .from("call_webhooks")
              .update({
                last_triggered_at: new Date().toISOString(),
                last_error: errorMessage,
              })
              .eq("id", webhook.id);
          }

          const duration = Date.now() - startTime;

          // Log the webhook delivery
          await supabase.from("call_webhook_logs").insert({
            webhook_id: webhook.id,
            outbound_call_id: call.id,
            event_type: mappedStatus,
            request_payload: payload,
            response_status: responseStatus,
            response_body: responseBody?.slice(0, 1000),
            error_message: errorMessage,
            duration_ms: duration,
          });
        }
      }

      return new Response(
        JSON.stringify({ success: true, status: mappedStatus }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Unknown action" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  } catch (error) {
    console.error("[elevenlabs-call-status] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
