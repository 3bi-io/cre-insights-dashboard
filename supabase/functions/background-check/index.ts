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
import { extractIPFromRequest, getGeoLocation } from "../_shared/geo-lookup.ts";
import { checkGeoAccess } from "../_shared/geo-blocking.ts";

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

  // Geo-blocking check - server-side enforcement for PII protection
  const clientIP = extractIPFromRequest(req);
  const geo = await getGeoLocation(clientIP);
  const geoResult = checkGeoAccess(geo);
  
  if (!geoResult.allowed) {
    console.log(`[${correlationId}] Blocked from restricted region: ${geoResult.countryCode}`);
    return new Response(JSON.stringify({
      success: false,
      error: geoResult.message || 'Access is not available in your region.',
      blocked: true,
      reason: 'geographic_restriction',
    }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header if present
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const body = await req.json();
    const { 
      action = "initiate",
      applicationId, 
      connectionId,
      providerId, 
      checkType,
      checkTypes,
      packageName 
    } = body;

    console.log(`[${correlationId}] Action: ${action}, ApplicationId: ${applicationId}, ConnectionId: ${connectionId}`);

    // Handle test connection action
    if (action === "test") {
      if (!connectionId) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "connectionId is required for test action" 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get connection and provider
      const { data: conn, error: connError } = await supabase
        .from("organization_bgc_connections")
        .select("*, background_check_providers(*)")
        .eq("id", connectionId)
        .single();

      if (connError || !conn) {
        console.error(`[${correlationId}] Connection not found:`, connError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Connection not found" 
        }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const connection = conn as unknown as BGCConnection;
      const provider = conn.background_check_providers as unknown as BGCProvider;

      // Test the connection
      try {
        const adapter = createBGCAdapter({ provider, connection, correlationId });
        const testResult = await adapter.testConnection();
        
        console.log(`[${correlationId}] Test connection result:`, testResult);
        
        return new Response(JSON.stringify({
          success: testResult.status === "success",
          message: testResult.message || (testResult.status === "success" ? "Connection successful" : "Connection failed"),
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (testError) {
        console.error(`[${correlationId}] Test connection error:`, testError);
        return new Response(JSON.stringify({
          success: false,
          message: (testError as Error).message || "Connection test failed",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Handle initiate action
    if (!applicationId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "applicationId is required" 
      }), {
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
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Application not found" 
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const organizationId = application.job_listings?.organization_id;

    // Get provider and connection
    let connection: BGCConnection | null = null;
    let provider: BGCProvider | null = null;

    if (connectionId) {
      // Use specific connection
      const { data: conn } = await supabase
        .from("organization_bgc_connections")
        .select("*, background_check_providers(*)")
        .eq("id", connectionId)
        .eq("is_enabled", true)
        .single();
      
      if (conn) {
        connection = conn as unknown as BGCConnection;
        provider = conn.background_check_providers as unknown as BGCProvider;
      }
    } else if (providerId) {
      // Find connection by provider_id
      const { data: conn } = await supabase
        .from("organization_bgc_connections")
        .select("*, background_check_providers(*)")
        .eq("organization_id", organizationId)
        .eq("provider_id", providerId)
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
      return new Response(JSON.stringify({ 
        success: false, 
        error: "No BGC provider configured" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map application to candidate data
    const candidate = mapApplicationToCandidate(application);
    
    // Determine check types - accept both checkType (string) and checkTypes (array)
    let checks: CheckType[];
    if (checkTypes && Array.isArray(checkTypes)) {
      checks = checkTypes;
    } else if (checkType && typeof checkType === "string") {
      // Handle comma-separated string
      checks = checkType.split(",").map(t => t.trim()) as CheckType[];
    } else {
      checks = getDefaultCheckTypes(
        !!application.driver_license_number || !!application.cdl,
        !!application.ssn
      );
    }

    // Create adapter and initiate check
    const adapter = createBGCAdapter({ provider, connection, correlationId });
    const result = await adapter.initiateCheck({
      candidate,
      check_types: checks,
      package_name: packageName,
    });

    // Record the request
    const { data: insertedRequest, error: insertError } = await supabase
      .from("background_check_requests")
      .insert({
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
        initiated_by: userId,
      })
      .select()
      .single();

    if (insertError) {
      console.error(`[${correlationId}] Error recording request:`, insertError);
    }

    console.log(`[${correlationId}] Background check initiated:`, result.external_id);

    // Return consistent response shape
    return new Response(JSON.stringify({
      success: true,
      requestId: insertedRequest?.id || null,
      externalId: result.external_id,
      candidateId: result.candidate_id,
      candidatePortalUrl: result.candidate_portal_url,
      status: result.status,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[${correlationId}] Error:`, error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: (error as Error).message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
