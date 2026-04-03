// Admin retry function for failed ATS deliveries — uses service role internally
import { getServiceClient } from '../_shared/supabase-client.ts';
import { createATSAdapter } from '../_shared/ats-adapters/index.ts';
import { enrichWithTranscript } from '../_shared/ats-adapters/transcript-enrichment.ts';
import { createLogger } from '../_shared/logger.ts';
import type { ApplicationData } from '../_shared/ats-adapters/types.ts';

const logger = createLogger('ats-retry');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Prepare application data
    const appData: ApplicationData = application as any;
    
    // Enrich with transcript if available
    const enrichedData = await enrichWithTranscript(supabase, appData);

    // Send to ATS
    const result = await adapter.sendApplication(enrichedData);

    // Log sync result
    await supabase.from('ats_sync_logs').insert({
      ats_connection_id: connection_id,
      application_id,
      action: 'send_application',
      status: result.success ? 'success' : 'error',
      response_data: result.data || null,
      error_message: result.error || null,
    });

    // Update sync stats
    await supabase.rpc('increment_ats_sync_stats', {
      p_connection_id: connection_id,
      p_success: result.success,
    });

    return new Response(
      JSON.stringify(result),
      { status: result.success ? 200 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('Retry failed', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
