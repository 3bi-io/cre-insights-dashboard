/**
 * Authentication Utilities for Edge Functions
 * Provides user verification and authorization helpers
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AuthenticationError, AuthorizationError } from './error-handler.ts';

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
  organization_id?: string;
}

/**
 * Create a Supabase client with service role key
 */
export function createServiceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!url || !key) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(url, key);
}

/**
 * Verify user from Authorization header
 * Returns user data or throws AuthenticationError
 */
export async function verifyUser(req: Request): Promise<AuthUser> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader) {
    throw new AuthenticationError('Missing authorization header');
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    throw new AuthenticationError('Invalid authorization token');
  }
  
  const supabase = createServiceClient();
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new AuthenticationError('Invalid or expired token');
  }
  
  // Fetch additional user data from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();
  
  return {
    id: user.id,
    email: user.email,
    organization_id: profile?.organization_id,
  };
}

/**
 * Verify user is authenticated (optional - returns null if not authenticated)
 */
export async function verifyUserOptional(req: Request): Promise<AuthUser | null> {
  try {
    return await verifyUser(req);
  } catch {
    return null;
  }
}

/**
 * Verify user has a specific role
 */
export async function verifyUserRole(
  req: Request,
  requiredRole: 'admin' | 'moderator' | 'user' | 'super_admin'
): Promise<AuthUser> {
  const user = await verifyUser(req);
  
  const supabase = createServiceClient();
  
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);
  
  const userRoles = roles?.map(r => r.role) || [];
  
  // Super admin can do anything
  if (userRoles.includes('super_admin')) {
    return { ...user, role: 'super_admin' };
  }
  
  // Check for required role
  if (!userRoles.includes(requiredRole)) {
    throw new AuthorizationError(`Required role: ${requiredRole}`);
  }
  
  return { ...user, role: requiredRole };
}

/**
 * Verify user belongs to a specific organization
 */
export async function verifyUserOrganization(
  req: Request,
  organizationId: string
): Promise<AuthUser> {
  const user = await verifyUser(req);
  
  if (user.organization_id !== organizationId) {
    throw new AuthorizationError('User does not belong to this organization');
  }
  
  return user;
}

/**
 * Check if request is from internal service (using service role key)
 */
export function isServiceRequest(req: Request): boolean {
  const authHeader = req.headers.get('authorization');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!authHeader || !serviceKey) return false;
  
  return authHeader.includes(serviceKey);
}

/**
 * Checks if a URL is safe (not targeting internal/private networks).
 * Blocks RFC-1918, link-local, localhost, and cloud metadata endpoints.
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return false;
    if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') return false;

    const parts = hostname.split('.');
    if (parts.length === 4 && parts.every(p => /^\d+$/.test(p))) {
      const first = parseInt(parts[0]);
      const second = parseInt(parts[1]);
      if (first === 10) return false;
      if (first === 172 && second >= 16 && second <= 31) return false;
      if (first === 192 && second === 168) return false;
      if (first === 169 && second === 254) return false;
      if (first === 0) return false;
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Get organization ID from authenticated user
 */
export async function getUserOrganizationId(req: Request): Promise<string | null> {
  try {
    const user = await verifyUser(req);
    return user.organization_id || null;
  } catch {
    return null;
  }
}
