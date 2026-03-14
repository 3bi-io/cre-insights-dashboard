import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('admin-check');

/**
 * Server-Side Authorization Check
 * 
 * CRITICAL SECURITY: Always validate admin/super_admin status server-side.
 * Client-side checks can be bypassed. This edge function provides
 * authoritative authorization validation.
 */
serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          authorized: false, 
          error: 'Missing authorization header' 
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      logger.error('Authentication failed', authError);
      return new Response(
        JSON.stringify({ 
          authorized: false, 
          error: 'Authentication failed' 
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { requiredRole = 'admin' } = await req.json().catch(() => ({ requiredRole: 'admin' }));

    const { data: roleData, error: roleError } = await supabase
      .rpc('get_current_user_role');

    if (roleError) {
      logger.error('Role check failed', roleError);
      return new Response(
        JSON.stringify({ 
          authorized: false, 
          error: 'Failed to verify user role' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const userRole = roleData as string;

    if (userRole === 'super_admin') {
      return new Response(
        JSON.stringify({ 
          authorized: true, 
          role: 'super_admin',
          userId: user.id 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const allowedRoles: Record<string, string[]> = {
      'admin': ['admin', 'super_admin'],
      'moderator': ['moderator', 'admin', 'super_admin'],
      'user': ['user', 'moderator', 'admin', 'super_admin'],
    };

    const isAuthorized = allowedRoles[requiredRole]?.includes(userRole) ?? false;

    if (!isAuthorized) {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        table_name: 'authorization',
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        sensitive_fields: ['role_check'],
      }).catch((err: unknown) => logger.error('Audit log failed', err));

      return new Response(
        JSON.stringify({ 
          authorized: false, 
          error: 'Insufficient permissions',
          requiredRole,
          userRole 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        authorized: true, 
        role: userRole,
        userId: user.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: unknown) {
    logger.error('Admin check error', error);
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
