import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { enforceAuth, hasRequiredRole, logSecurityEvent, getClientInfo, type UserRole } from "../_shared/serverAuth.ts";
import { getAuthenticatedClient } from "../_shared/supabase-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Server-Side Authorization Check
 * 
 * CRITICAL SECURITY: Always validate admin/super_admin status server-side.
 * Client-side checks can be bypassed. This edge function provides
 * authoritative authorization validation.
 * 
 * Refactored to use shared authentication utilities for consistency.
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body for required role
    const { requiredRole = 'admin' } = await req.json().catch(() => ({}));

    // Verify authentication (no role requirement at this stage)
    const authResult = await enforceAuth(req);
    
    // If auth failed, return the error response
    if (authResult instanceof Response) {
      return authResult;
    }

    // Auth succeeded, check role
    const isAuthorized = hasRequiredRole(authResult.userRole, requiredRole as UserRole);

    // Get client info for audit logging
    const { ipAddress, userAgent } = getClientInfo(req);
    const supabase = getAuthenticatedClient(req);

    if (!isAuthorized) {
      // Log unauthorized access attempt
      await logSecurityEvent(supabase, authResult, 'UNAUTHORIZED_ACCESS_ATTEMPT', {
        table: 'authorization',
        sensitiveFields: ['role_check'],
        ipAddress,
        userAgent,
      });

      return new Response(
        JSON.stringify({ 
          authorized: false, 
          error: 'Insufficient permissions',
          required: requiredRole,
          actual: authResult.userRole 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Success - user is authorized
    console.log(`[AUTH] User ${authResult.userId} authorized as ${authResult.userRole} for role: ${requiredRole}`);
    
    return new Response(
      JSON.stringify({ 
        authorized: true, 
        role: authResult.userRole,
        userId: authResult.userId 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[AUTH] Admin check error:', error);
    return new Response(
      JSON.stringify({ 
        authorized: false, 
        error: 'Internal server error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
