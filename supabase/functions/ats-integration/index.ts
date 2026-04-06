// Native Deno.serve — no legacy import needed
import { createClient } from 'npm:@supabase/supabase-js@2.50.0';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { createATSAdapter } from '../_shared/ats-adapters/index.ts';
import { enrichWithTranscript } from '../_shared/ats-adapters/transcript-enrichment.ts';
import { createLogger } from '../_shared/logger.ts';
import { getCorsHeaders, handleCorsPreflightIfNeeded } from '../_shared/cors-config.ts';
import { isDoubleNickelAllowed } from '../_shared/ats-constants.ts';
import type { 
  ATSRequest, 
  ATSResponse, 
  ATSSystem, 
  ATSConnection, 
  FieldMapping,
  ApplicationData 
} from '../_shared/ats-adapters/types.ts';

const logger = createLogger('ats-integration');

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const supabase = getServiceClient();

    // Require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const userId: string = user.id;

    // Parse request
    const request: ATSRequest = await req.json();
    const { action, connection_id, application_id, application_data, options } = request;

    logger.info(`Action: ${action}`, { connectionId: connection_id });

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
      logger.error('Connection not found', connError);
      return new Response(
        JSON.stringify({ success: false, error: 'ATS connection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user belongs to the connection's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (!profile || profile.organization_id !== connection.organization_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: organization mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

          // Enrich with call transcript using shared helper
          appData = await enrichWithTranscript(supabase, appData) as ApplicationData;

          // Enrich with company_name from job_listing -> organization
          if (appData.job_listing_id) {
            const { data: jobData } = await supabase
              .from('job_listings')
              .select('organization_id, organizations(name)')
              .eq('id', appData.job_listing_id)
              .single();

            if (jobData) {
              const orgName = (jobData as any).organizations?.name || '';
              if (!appData.company_name) {
                appData.company_name = orgName;
              }

              // Get client name for "Powered By" from ats_connection
              let clientName = '';
              if (atsConnection.client_id) {
                const { data: clientData } = await supabase
                  .from('clients')
                  .select('name')
                  .eq('id', atsConnection.client_id)
                  .single();
                clientName = clientData?.name || '';
              }
              appData.powered_by = clientName ? `${clientName} AI` : (orgName ? `${orgName} AI` : '');

              // Get apply URL from job_short_links
              const { data: shortLink } = await supabase
                .from('job_short_links')
                .select('short_code')
                .eq('job_listing_id', appData.job_listing_id)
                .eq('is_active', true)
                .limit(1)
                .single();

              if (shortLink?.short_code) {
                appData.apply_url = `https://applyai.jobs/j/${shortLink.short_code}`;
              } else {
                // Fallback to universal apply URL
                const orgId = (jobData as any).organization_id || '';
                const clientId = atsConnection.client_id || '';
                appData.apply_url = `https://applyai.jobs/apply?organization_id=${orgId}${clientId ? `&client_id=${clientId}` : ''}`;
              }
            }
          }
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
          const { error: rpcError } = await supabase.rpc('increment_ats_sync_stats', {
            p_connection_id: connection_id,
            p_success: true,
          });
          
          if (rpcError) {
            // RPC may not exist yet, update manually
            const stats = (atsConnection.sync_stats as { total_sent: number; total_success: number; total_failed: number } | null) || { total_sent: 0, total_success: 0, total_failed: 0 };
            await supabase.from('ats_connections').update({
              sync_stats: {
                total_sent: stats.total_sent + 1,
                total_success: stats.total_success + 1,
                total_failed: stats.total_failed,
              },
              last_sync_at: new Date().toISOString(),
            }).eq('id', connection_id);
          }
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
    logger.info(`Completed: ${action}`, { success: result.success, duration: totalDuration });

    return new Response(
      JSON.stringify({ ...result, total_duration_ms: totalDuration }),
      { 
        status: result.success ? 200 : 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    logger.error('Error processing request', error);
    
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
