/**
 * EXAMPLE: Secure Edge Function with Phase 1 Security Controls
 * 
 * This example demonstrates best practices for implementing
 * enterprise-grade security in Supabase Edge Functions
 * 
 * Copy this template when creating new edge functions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { 
  enforceAuth, 
  logSecurityEvent, 
  getClientInfo,
  createAuthenticatedClient,
  type AuthContext 
} from '../_shared/serverAuth.ts';
import {
  validateRequest,
  validationErrorResponse,
  searchApplicationSchema,
  uuidSchema,
  type z
} from '../_shared/securitySchemas.ts';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Main handler function
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    // =========================================================================
    // STEP 1: SERVER-SIDE AUTHENTICATION (REQUIRED)
    // =========================================================================
    // NEVER trust client-side role checks - always verify server-side
    
    const auth = await enforceAuth(req, ['admin', 'super_admin']); // Require admin role
    
    // If auth failed, enforceAuth returns a Response with error
    if (auth instanceof Response) {
      return auth; // Returns 401 or 403 with error message
    }
    
    // auth is now AuthContext with verified user info
    const { userId, userRole, organizationId, email } = auth;
    
    console.log(`[AUTH] User ${userId} (${userRole}) from org ${organizationId}`);

    // =========================================================================
    // STEP 2: INPUT VALIDATION (REQUIRED)
    // =========================================================================
    // ALWAYS validate all user inputs with Zod schemas
    
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    
    // Validate input using Zod schema
    let validatedData;
    try {
      validatedData = validateRequest(searchApplicationSchema, body);
    } catch (error) {
      console.error('[VALIDATION] Input validation failed:', error);
      return validationErrorResponse(error); // Returns 400 with details
    }

    console.log('[VALIDATION] Input validated:', validatedData);

    // =========================================================================
    // STEP 3: RATE LIMITING (RECOMMENDED)
    // =========================================================================
    // Prevent abuse and DoS attacks
    
    const supabase = createAuthenticatedClient(req);
    
    const rateLimitResult = await supabase.rpc('check_rate_limit', {
      _identifier: userId,
      _endpoint: 'example-endpoint',
      _max_requests: 100, // 100 requests
      _window_minutes: 60, // per hour
    });

    if (rateLimitResult.data && !rateLimitResult.data.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          retry_after: rateLimitResult.data.retry_after,
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.data.retry_after.toString(),
          } 
        }
      );
    }

    console.log('[RATE_LIMIT] Remaining:', rateLimitResult.data?.remaining);

    // =========================================================================
    // STEP 4: BUSINESS LOGIC WITH AUDIT LOGGING
    // =========================================================================
    
    // Example: Search for applications (non-sensitive data)
    const { data: applications, error: searchError } = await supabase
      .from('applications')
      .select('id, first_name, last_name, status, applied_at')
      .eq('applicant_email', validatedData.email)
      .limit(10);

    if (searchError) {
      console.error('[DB] Search failed:', searchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the search operation (non-PII)
    const { ipAddress, userAgent } = getClientInfo(req);
    await logSecurityEvent(supabase, auth, 'APPLICATION_SEARCH', {
      table: 'applications',
      ipAddress,
      userAgent,
    });

    console.log(`[SUCCESS] Found ${applications?.length || 0} applications`);

    // =========================================================================
    // STEP 5: ACCESSING SENSITIVE DATA (IF NEEDED)
    // =========================================================================
    // If you need PII, use get_application_sensitive_data() function
    
    // Example: Get sensitive data for first result
    if (applications && applications.length > 0 && validatedData.includeSensitive) {
      const applicationId = applications[0].id;
      
      // CRITICAL: Must provide access reason for audit trail
      const { data: sensitiveData, error: sensitiveError } = await supabase
        .rpc('get_application_sensitive_data', {
          application_id: applicationId,
          access_reason: 'User search request - compliance review',
        })
        .single();

      if (sensitiveError) {
        console.error('[PII_ACCESS] Failed:', sensitiveError);
        // Don't expose internal error details to client
        return new Response(
          JSON.stringify({ success: false, error: 'Access denied' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Sensitive data is now logged in audit_logs table automatically
      console.log('[PII_ACCESS] Sensitive data accessed for:', applicationId);
      
      // Add sensitive data to first result
      applications[0].sensitive = sensitiveData;
    }

    // =========================================================================
    // STEP 6: RETURN RESPONSE
    // =========================================================================
    
    return new Response(
      JSON.stringify({
        success: true,
        data: applications,
        count: applications?.length || 0,
        user: {
          id: userId,
          role: userRole,
          email: email,
        },
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('[ERROR] Unexpected error:', error);
    
    // SECURITY: Don't expose internal error details
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

/**
 * SECURITY CHECKLIST FOR EDGE FUNCTIONS
 * 
 * ✅ Server-side authentication with enforceAuth()
 * ✅ Input validation with Zod schemas
 * ✅ Rate limiting with check_rate_limit()
 * ✅ Audit logging for sensitive operations
 * ✅ PII access through get_application_sensitive_data()
 * ✅ Client info extraction (IP, user agent)
 * ✅ Proper error handling (don't expose internals)
 * ✅ CORS headers for browser requests
 * ✅ Method validation (POST, GET, etc.)
 * ✅ RLS enforcement via authenticated Supabase client
 * 
 * ANTI-PATTERNS TO AVOID
 * 
 * ❌ Trusting client-side role checks
 * ❌ Direct access to applications table for PII
 * ❌ Unvalidated user inputs
 * ❌ Missing rate limiting on public endpoints
 * ❌ No audit logging for sensitive operations
 * ❌ Exposing internal error messages to clients
 * ❌ Using service role key for user operations (bypasses RLS)
 * ❌ Not specifying access_reason for PII access
 */
