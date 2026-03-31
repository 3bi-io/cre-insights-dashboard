/**
 * One-time backfill: post undelivered applications to ATS
 * DELETE THIS FUNCTION after backfill is complete.
 */
import { getServiceClient } from '../_shared/supabase-client.ts';
import { autoPostToATS } from '../_shared/ats-adapters/auto-post-engine.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('backfill-ats-post');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  const { applicationIds, organizationId, clientId } = await req.json();

  if (!applicationIds?.length || !organizationId) {
    return new Response(JSON.stringify({ error: 'Missing applicationIds or organizationId' }), { status: 400 });
  }

  const supabase = getServiceClient();
  const results: Array<{ id: string; status: string; error?: string }> = [];

  for (const appId of applicationIds) {
    try {
      const { data: app } = await supabase.from('applications').select('*').eq('id', appId).single();
      if (!app) { results.push({ id: appId, status: 'not_found' }); continue; }

      await autoPostToATS(supabase, appId, organizationId, app as Record<string, unknown>, { clientId });
      results.push({ id: appId, status: 'posted' });
      logger.info(`Backfilled ${appId} (${app.first_name} ${app.last_name})`);
    } catch (e) {
      results.push({ id: appId, status: 'error', error: e.message });
      logger.error(`Failed backfill for ${appId}`, e);
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
