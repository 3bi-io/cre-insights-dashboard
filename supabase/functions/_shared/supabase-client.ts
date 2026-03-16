/**
 * Supabase Client Utilities for Edge Functions
 * Centralized client creation and management
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

/**
 * Get Supabase service role client (bypasses RLS)
 * Use with caution - only for admin operations
 */
export function getServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Get authenticated Supabase client from request
 * Respects RLS policies for the authenticated user
 */
export function getAuthenticatedClient(req: Request): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required Supabase environment variables');
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    throw new Error('No authorization header provided');
  }

  const token = authHeader.replace('Bearer ', '');
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

/**
 * Verify user authentication and get user ID
 * Returns user data or throws error
 */
export async function verifyUser(req: Request): Promise<{
  userId: string;
  email?: string;
}> {
  const supabase = getServiceClient();
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader) {
    throw new Error('No authorization header provided');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid or expired authentication token');
  }

  return {
    userId: user.id,
    email: user.email,
  };
}
