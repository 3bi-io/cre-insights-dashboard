import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createATSAdapter } from '../_shared/ats-adapters/index.ts';
import type { 
  ATSRequest, 
  ATSResponse, 
  ATSSystem, 
  ATSConnection, 
  FieldMapping,
  ApplicationData 
} from '../_shared/ats-adapters/types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth header for user context
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id || null;
    }

    // Parse request
    const request: ATSRequest = await req.json();
    const { action, connection_id, application_id, application_data, options } = request;

    console.log(`[ats-integration] Action: ${action}, Connection: ${connection_id}`);

    // Validate required fields
    if (!connection_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'connection_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch connection with system info
    const { data: connection, error: connError } = await supabase
      .from('ats_connections')
      .select(`
        *,
        ats_system:ats_systems(*)
      `)
      .eq('id', connection_id)
      .single();

    if (connError || !connection) {
      console.error('[ats-integration] Connection not found:', connError);
      return new Response(
        JSON.stringify({ success: false, error: 'ATS connection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const system = connection.ats_system as ATSSystem;
    const atsConnection = connection as unknown as ATSConnection;

    // Fetch default field mapping if exists
    let fieldMapping: FieldMapping | undefined;
    const { data: mappings } = await supabase
      .from('ats_field_mappings')
      .select('*')
      .eq('ats_connection_id', connection_id)
      .eq('is_default', true)
      .eq('is_active', true)
      .limit(1);

    if (mappings && mappings.length > 0) {
      fieldMapping = mappings[0] as FieldMapping;
    }

    // Create adapter
    const adapter = createATSAdapter(system, atsConnection, fieldMapping);

    let result: ATSResponse;

    switch (action) {
      case 'test_connection':
        result = await adapter.testConnection();
        
        // Update connection status based on result
        await supabase
          .from('ats_connections')
          .update({
            status: result.success ? 'active' : 'error',
            last_error: result.success ? null : result.error,
            last_sync_at: new Date().toISOString(),
          })
          .eq('id', connection_id);
        break;

      case 'send_application':
        // Fetch application data if not provided
        let appData: ApplicationData;
        
        if (application_data) {
          appData = application_data;
        } else if (application_id) {
          const { data: app, error: appError } = await supabase
            .from('applications')
            .select('*')
            .eq('id', application_id)
            .single();

          if (appError || !app) {
            return new Response(
              JSON.stringify({ success: false, error: 'Application not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          appData = app as ApplicationData;
        } else {
          return new Response(
            JSON.stringify({ success: false, error: 'application_id or application_data is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        result = await adapter.sendApplication(appData);
        
        // Log the sync attempt
        await supabase.from('ats_sync_logs').insert({
          ats_connection_id: connection_id,
          application_id: appData.id,
          action: 'send_application',
          status: result.success ? 'success' : 'failed',
          request_payload: sanitizePayload(appData),
          response_data: result.data || null,
          error_message: result.error || null,
          duration_ms: result.duration_ms,
        });

        // Update connection stats
        if (result.success) {
          await supabase.rpc('increment_ats_sync_stats', {
            p_connection_id: connection_id,
            p_success: true,
          }).catch(() => {
            // RPC may not exist yet, update manually
            const stats = atsConnection.sync_stats || { total_sent: 0, total_success: 0, total_failed: 0 };
            supabase.from('ats_connections').update({
              sync_stats: {
                total_sent: stats.total_sent + 1,
                total_success: stats.total_success + 1,
                total_failed: stats.total_failed,
              },
              last_sync_at: new Date().toISOString(),
            }).eq('id', connection_id);
          });
        }
        break;

      case 'sync_status':
        if (!options?.external_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'external_id is required in options' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await adapter.syncStatus(options.external_id as string);
        break;

      case 'search':
        if (!options?.criteria) {
          return new Response(
            JSON.stringify({ success: false, error: 'criteria is required in options' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await adapter.search(options.criteria as Record<string, string>);
        break;

      case 'get_jobs':
        result = await adapter.getJobs();
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[ats-integration] Completed: ${action}, success: ${result.success}, duration: ${totalDuration}ms`);

    return new Response(
      JSON.stringify({ ...result, total_duration_ms: totalDuration }),
      { 
        status: result.success ? 200 : 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[ats-integration] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        duration_ms: Date.now() - startTime,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Sanitize payload for logging (remove PII)
 */
function sanitizePayload(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = [
    'ssn', 'social_security', 'date_of_birth', 'dob', 
    'government_id', 'password', 'api_key', 'secret',
    'felony_details', 'medical_card_expiration'
  ];
  
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}
