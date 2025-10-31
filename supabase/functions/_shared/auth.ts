/**
 * Shared authentication and authorization utilities for edge functions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'user';

export interface AuthResult {
  authorized: boolean;
  userId?: string;
  role?: UserRole;
  organizationId?: string;
  error?: string;
}

/**
 * Verify JWT token and get user information
 */
export async function verifyAuth(
  authHeader: string | null,
  supabaseUrl: string,
  supabaseKey: string
): Promise<AuthResult> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      error: 'Missing or invalid authorization header'
    };
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify the JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return {
        authorized: false,
        error: 'Invalid or expired token'
      };
    }

    // Get user role
    const { data: roleData, error: roleError } = await supabase.rpc(
      'get_current_user_role'
    );

    if (roleError) {
      console.error('[AUTH] Error fetching user role:', roleError);
      return {
        authorized: true,
        userId: user.id,
        role: 'user'
      };
    }

    // Get user organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    return {
      authorized: true,
      userId: user.id,
      role: (roleData as UserRole) || 'user',
      organizationId: profile?.organization_id
    };
  } catch (error) {
    console.error('[AUTH] Verification error:', error);
    return {
      authorized: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * Check if user has required role
 */
export function hasRequiredRole(
  userRole: UserRole,
  requiredRole: UserRole | UserRole[]
): boolean {
  const roleHierarchy: { [key in UserRole]: number } = {
    'super_admin': 4,
    'admin': 3,
    'moderator': 2,
    'user': 1
  };

  const userLevel = roleHierarchy[userRole] || 0;

  if (Array.isArray(requiredRole)) {
    return requiredRole.some(role => userLevel >= roleHierarchy[role]);
  }

  return userLevel >= roleHierarchy[requiredRole];
}

/**
 * Middleware to enforce authentication and authorization
 */
export async function enforceAuth(
  request: Request,
  requiredRole?: UserRole | UserRole[]
): Promise<AuthResult | Response> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const authHeader = request.headers.get('Authorization');
  const authResult = await verifyAuth(authHeader, supabaseUrl, supabaseKey);

  if (!authResult.authorized) {
    return new Response(
      JSON.stringify({ error: authResult.error || 'Unauthorized' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Check role if required
  if (requiredRole && authResult.role && !hasRequiredRole(authResult.role, requiredRole)) {
    return new Response(
      JSON.stringify({ 
        error: 'Insufficient permissions',
        required: requiredRole,
        current: authResult.role
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return authResult;
}
