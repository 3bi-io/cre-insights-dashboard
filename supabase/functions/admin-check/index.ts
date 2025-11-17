import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { enforceAuth, hasRequiredRole, logSecurityEvent, getClientInfo, type UserRole } from "../_shared/serverAuth.ts";
import { getAuthenticatedClient } from "../_shared/supabase-client.ts";
import { getCorsHeaders } from "../_shared/cors-config.ts";
import { successResponse, errorResponse } from "../_shared/response.ts";
import { wrapHandler } from "../_shared/error-handler.ts";
import { createLogger } from "../_shared/logger.ts";

const logger = createLogger('admin-check');

/**
 * Server-Side Authorization Check
 * 
 * CRITICAL SECURITY: Always validate admin/super_admin status server-side.
 * Client-side checks can be bypassed. This edge function provides
 * authoritative authorization validation.
 */
const handler = wrapHandler(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

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

    logger.warn('Unauthorized access attempt', {
      userId: authResult.userId,
      userRole: authResult.userRole,
      requiredRole,
      ipAddress,
    });

    return errorResponse(
      'Insufficient permissions',
      403,
      {
        required: requiredRole,
        actual: authResult.userRole,
      },
      origin
    );
  }

  // Success - user is authorized
  logger.info('User authorized', {
    userId: authResult.userId,
    userRole: authResult.userRole,
    requiredRole,
  });
  
  return successResponse(
    {
      authorized: true, 
      role: authResult.userRole,
      userId: authResult.userId,
    },
    undefined,
    undefined,
    origin
  );
}, { context: 'admin-check', logRequests: true });

serve(handler);
