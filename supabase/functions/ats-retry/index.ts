// Admin retry function for failed ATS deliveries — requires super_admin role
import { getServiceClient } from '../_shared/supabase-client.ts';
import { verifyUserRole } from '../_shared/auth.ts';
import { getCorsHeaders, handleCorsPreflightIfNeeded } from '../_shared/cors-config.ts';
import { enforceRateLimit, getRateLimitIdentifier } from '../_shared/rate-limiter.ts';
import { createATSAdapter } from '../_shared/ats-adapters/index.ts';
import { enrichWithTranscript } from '../_shared/ats-adapters/transcript-enrichment.ts';
import { createLogger } from '../_shared/logger.ts';
import { isDoubleNickelAllowed } from '../_shared/ats-constants.ts';
import type { ApplicationData } from '../_shared/ats-adapters/types.ts';

const logger = createLogger('ats-retry');

Deno.serve(async (req) => {
  const preflightResponse = handleCorsPreflightIfNeeded(req);
  if (preflightResponse) return preflightResponse;

  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Verify caller is super_admin
    await verifyUserRole(req, 'super_admin');

    // Rate limit: 10 retries per minute per user
    const identifier = getRateLimitIdentifier(req, true);
    await enforceRateLimit(identifier, { maxRequests: 10, windowMs: 60000, keyPrefix: 'ats-retry' });

    const supabase = getServiceClient();
    const { connection_id, application_id } = await req.json();

    if (!connection_id || !application_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'connection_id and application_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info(`Retrying application ${application_id} on connection ${connection_id}`);

    // Fetch connection with system info
    const { data: connection, error: connError } = await supabase
      .from('ats_connections')
      .select('*, ats_system:ats_systems(*)')
      .eq('id', connection_id)
      .single();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ success: false, error: 'Connection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Double Nickel client restriction: only R.E. Garrison
    const systemSlug = (connection.ats_system as any)?.slug;
    if (!isDoubleNickelAllowed(systemSlug, connection.client_id)) {
      logger.error('Double Nickel retry blocked — non-Garrison client', null, {
        connection_id, client_id: connection.client_id
      });
      return new Response(
        JSON.stringify({ success: false, error: 'Double Nickel is restricted to R.E. Garrison client only' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch application
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', application_id)
      .single();

    if (appError || !application) {
      return new Response(
        JSON.stringify({ success: false, error: 'Application not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get field mappings
    const { data: fieldMappings } = await supabase
      .from('ats_field_mappings')
      .select('*')
      .eq('ats_connection_id', connection_id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .limit(1);

    const activeMapping = fieldMappings?.[0] || null;

    // Create adapter
    const adapter = createATSAdapter(
      connection.ats_system as any,
      connection as any,
      activeMapping as any
    );

    // Prepare application data and enrich with transcript
    const appData: ApplicationData = application as any;
    const enrichedData = await enrichWithTranscript(supabase, appData) as ApplicationData;

    // Send to ATS
    const result = await adapter.sendApplication(enrichedData);

    // Log sync result with error checking
    const { error: logError } = await supabase.from('ats_sync_logs').insert({
      ats_connection_id: connection_id,
      application_id,
      action: 'send_application',
      status: result.success ? 'success' : 'error',
      response_data: result.data || null,
      error_message: result.error || null,
    });

    if (logError) {
      logger.warn('Failed to insert sync log', { error: logError.message, application_id });
    }

    // Update sync stats with error checking
    const { error: statsError } = await supabase.rpc('increment_ats_sync_stats', {
      p_connection_id: connection_id,
      p_success: result.success,
    });

    if (statsError) {
      logger.warn('Failed to increment sync stats', { error: statsError.message, connection_id });
    }

    return new Response(
      JSON.stringify(result),
      { status: result.success ? 200 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('Retry failed', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: error.message?.includes('Unauthorized') || error.message?.includes('Forbidden') ? 403 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
