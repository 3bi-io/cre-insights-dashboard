/**
 * Server-side authentication and authorization utilities
 * CRITICAL SECURITY: Always validate roles server-side, never trust client
 */

import { createClient } from 'npm:@supabase/supabase-js@2.50.0';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.50.0';
import { createLogger } from './logger.ts';

const logger = createLogger('serverAuth');

export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'recruiter' | 'user';

export interface AuthContext {
  userId: string;
  userRole: UserRole;
  organizationId: string | null;
  email: string;
}

export type AuthResult = {
  success: true;
  context: AuthContext;
} | {
  success: false;
  error: string;
  status: number;
};

/**
 * CRITICAL: Extract and verify JWT token from Authorization header
 * This is the ONLY way to verify user identity server-side
 */
export async function verifyAuth(request: Request): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Missing or invalid Authorization header',
        status: 401,
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Initialize Supabase client with service role for verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      logger.error('Missing Supabase environment variables');
      return {
        success: false,
        error: 'Server configuration error',
        status: 500,
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    // Verify token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      logger.error('Token verification failed', null, { error: userError?.message });
      return {
        success: false,
        error: 'Invalid or expired token',
        status: 401,
      };
    }

    // Get user role and organization from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logger.error('Failed to fetch user profile', null, { error: profileError.message });
      return {
        success: false,
        error: 'Failed to load user profile',
        status: 500,
      };
    }

    // Get user role - CRITICAL: This must be server-side query
    const { data: roleData, error: roleError } = await supabase
      .rpc('get_current_user_role');

    if (roleError) {
      logger.error('Failed to fetch user role', null, { error: roleError.message });
      return {
        success: false,
        error: 'Failed to load user role',
        status: 500,
      };
    }

    const userRole = (roleData as UserRole) || 'user';

    return {
      success: true,
      context: {
        userId: user.id,
        userRole,
        organizationId: profile?.organization_id || null,
        email: user.email || '',
      },
    };
  } catch (error) {
    logger.error('Unexpected error during authentication', error);
    return {
      success: false,
      error: 'Authentication failed',
      status: 500,
    };
  }
}

/**
 * CRITICAL: Check if user has required role
 * Role hierarchy: super_admin > admin > moderator > recruiter > user
 */
export function hasRequiredRole(
  userRole: UserRole,
  requiredRole: UserRole | UserRole[]
): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    super_admin: 5,
    admin: 4,
    moderator: 3,
    recruiter: 2,
    user: 1,
  };

  const userLevel = roleHierarchy[userRole];
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.some((role) => userLevel >= roleHierarchy[role]);
  }
  
  return userLevel >= roleHierarchy[requiredRole];
}

/**
 * Middleware: Verify authentication and enforce role requirements
 * Returns AuthContext on success or Response with error on failure
 */
export async function enforceAuth(
  request: Request,
  requiredRole?: UserRole | UserRole[]
): Promise<AuthContext | Response> {
  const authResult = await verifyAuth(request);
  
  if (!authResult.success) {
    return new Response(
      JSON.stringify({
        success: false,
        error: authResult.error,
      }),
      {
        status: authResult.status,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Check role requirement
  if (requiredRole && !hasRequiredRole(authResult.context.userRole, requiredRole)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Insufficient permissions',
        required: Array.isArray(requiredRole) ? requiredRole : [requiredRole],
        actual: authResult.context.userRole,
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return authResult.context;
}

/**
 * Create Supabase client with user's JWT for RLS
 * Use this to ensure RLS policies are enforced
 */
export function createAuthenticatedClient(request: Request): SupabaseClient {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });
}

/**
 * Log security event to audit logs
 */
export async function logSecurityEvent(
  supabase: SupabaseClient,
  context: AuthContext,
  action: string,
  details: {
    table?: string;
    recordId?: string;
    sensitiveFields?: string[];
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      user_id: context.userId,
      organization_id: context.organizationId,
      table_name: details.table || 'unknown',
      record_id: details.recordId || null,
      action,
      sensitive_fields: details.sensitiveFields || [],
      ip_address: details.ipAddress || null,
      user_agent: details.userAgent || null,
    });
  } catch (error) {
    logger.error('Failed to log security event', error);
    // Don't throw - logging failure shouldn't break the request
  }
}

/**
 * Extract client IP and User-Agent from request
 */
export function getClientInfo(request: Request): {
  ipAddress: string;
  userAgent: string;
} {
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return { ipAddress, userAgent };
}
