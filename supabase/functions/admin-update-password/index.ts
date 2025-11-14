import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceAuth, logSecurityEvent, getClientInfo } from "../_shared/serverAuth.ts";
import { getServiceClient, getAuthenticatedClient } from "../_shared/supabase-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface PasswordUpdateRequest {
  email?: string;
  new_password?: string;
  user_id?: string;
}

/**
 * Admin Password Update Function
 * 
 * SECURITY: Only admin and super_admin roles can update user passwords
 * All password updates are logged to audit_logs for security tracking
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[PASSWORD-UPDATE] Starting password update request');

    // Verify authentication and require admin/super_admin role
    const authResult = await enforceAuth(req, ['admin', 'super_admin']);
    
    if (authResult instanceof Response) {
      return authResult;
    }

    // Parse and validate request body
    const body: PasswordUpdateRequest = await req.json();
    const email = (body.email || "").toLowerCase().trim();
    const newPassword = (body.new_password || "").trim();
    const targetUserId = (body.user_id || "").trim();

    // Validate password requirements
    if (!newPassword || newPassword.length < 8) {
      console.warn('[PASSWORD-UPDATE] Invalid password length');
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Require either user_id or email
    if (!targetUserId && !email) {
      return new Response(
        JSON.stringify({ error: "Provide either user_id or email" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get service client for privileged operations
    const admin = getServiceClient();
    let userId = targetUserId;

    // Resolve user ID from email if needed
    if (!userId && email) {
      console.log(`[PASSWORD-UPDATE] Resolving user ID for email: ${email}`);
      
      // Try auth.admin.listUsers first
      try {
        const { data: usersList, error: listError } = await admin.auth.admin.listUsers();
        if (!listError && usersList?.users?.length) {
          const match = usersList.users.find((u: any) => (u.email || "").toLowerCase() === email);
          if (match?.id) {
            userId = match.id;
            console.log(`[PASSWORD-UPDATE] Found user via auth: ${userId}`);
          }
        }
      } catch (e) {
        console.warn('[PASSWORD-UPDATE] listUsers failed:', e);
      }

      // Fallback to profiles table
      if (!userId) {
        const { data: profile, error: profileError } = await admin
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (profileError || !profile?.id) {
          console.error('[PASSWORD-UPDATE] User not found:', email);
          return new Response(
            JSON.stringify({ error: "User not found" }),
            { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        userId = profile.id;
        console.log(`[PASSWORD-UPDATE] Found user via profiles: ${userId}`);
      }
    }

    // Update password using Admin API
    console.log(`[PASSWORD-UPDATE] Updating password for user: ${userId}`);
    const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateError) {
      console.error('[PASSWORD-UPDATE] Update failed:', updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Log successful password update to audit logs
    const { ipAddress, userAgent } = getClientInfo(req);
    const supabase = getAuthenticatedClient(req);
    
    await logSecurityEvent(supabase, authResult, 'PASSWORD_RESET_BY_ADMIN', {
      table: 'auth.users',
      recordId: userId,
      sensitiveFields: ['password'],
      ipAddress,
      userAgent,
    });

    console.log(`[PASSWORD-UPDATE] Successfully updated password for user: ${userId}`);
    
    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (e) {
    console.error('[PASSWORD-UPDATE] Unexpected error:', e);
    return new Response(
      JSON.stringify({ error: "Unexpected error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
