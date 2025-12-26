import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  createBGCAdapter,
  mapApplicationToCandidate,
  getDefaultCheckTypes,
  BGCProvider,
  BGCConnection,
  CheckType,
} from "../_shared/bgc-adapters/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const correlationId = crypto.randomUUID();
  console.log(`[${correlationId}] Background check request received`);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { applicationId, providerId, checkTypes, packageName } = await req.json();

    if (!applicationId) {
      return new Response(JSON.stringify({ error: "applicationId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get application data
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("*, job_listings(organization_id)")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      console.error(`[${correlationId}] Application not found:`, appError);
      return new Response(JSON.stringify({ error: "Application not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const organizationId = application.job_listings?.organization_id;

    // Get provider and connection
    let connection: BGCConnection | null = null;
    let provider: BGCProvider | null = null;

    if (providerId) {
      const { data: conn } = await supabase
        .from("organization_bgc_connections")
        .select("*, background_check_providers(*)")
        .eq("id", providerId)
        .eq("is_enabled", true)
        .single();
      
      if (conn) {
        connection = conn as unknown as BGCConnection;
        provider = conn.background_check_providers as unknown as BGCProvider;
      }
    } else {
      // Get default provider for org
      const { data: conn } = await supabase
        .from("organization_bgc_connections")
        .select("*, background_check_providers(*)")
        .eq("organization_id", organizationId)
        .eq("is_default", true)
        .eq("is_enabled", true)
        .single();
      
      if (conn) {
        connection = conn as unknown as BGCConnection;
        provider = conn.background_check_providers as unknown as BGCProvider;
      }
    }

    if (!provider || !connection) {
      return new Response(JSON.stringify({ error: "No BGC provider configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map application to candidate data
    const candidate = mapApplicationToCandidate(application);
    
    // Determine check types
    const checks: CheckType[] = checkTypes || getDefaultCheckTypes(
      !!application.driver_license_number || !!application.cdl,
      !!application.ssn
    );

    // Create adapter and initiate check
    const adapter = createBGCAdapter({ provider, connection, correlationId });
    const result = await adapter.initiateCheck({
      candidate,
      check_types: checks,
      package_name: packageName,
    });

    // Record the request
    await supabase.from("background_check_requests").insert({
      organization_id: organizationId,
      application_id: applicationId,
      provider_id: provider.id,
      connection_id: connection.id,
      external_id: result.external_id,
      candidate_id: result.candidate_id,
      check_type: checks.join(","),
      package_name: packageName,
      status: result.status,
      candidate_portal_url: result.candidate_portal_url,
    });

    console.log(`[${correlationId}] Background check initiated:`, result.external_id);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[${correlationId}] Error:`, error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
