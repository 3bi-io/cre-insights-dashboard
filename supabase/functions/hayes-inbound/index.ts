/**
 * Hayes Unified Inbound Endpoint
 * 
 * Parameterized endpoint for all Hayes clients:
 * - Job sync: GET /functions/v1/hayes-inbound?client=danny-herman&action=jobs
 * - Application: POST /functions/v1/hayes-inbound?client=danny-herman
 * 
 * Supported client keys: danny-herman, dayross, james-burg, novco, pemberton
 * 
 * Existing client-specific endpoints remain for backward compatibility.
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClientHandler, HAYES_CLIENT_CONFIGS } from '../_shared/hayes-client-handler.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('hayes-inbound');

serve(async (req) => {
  const url = new URL(req.url);
  const clientKey = url.searchParams.get('client');

  if (!clientKey) {
    return new Response(
      JSON.stringify({ 
        error: 'Missing required "client" query parameter',
        available_clients: Object.keys(HAYES_CLIENT_CONFIGS),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const config = HAYES_CLIENT_CONFIGS[clientKey];
  if (!config) {
    return new Response(
      JSON.stringify({ 
        error: `Unknown client: ${clientKey}`,
        available_clients: Object.keys(HAYES_CLIENT_CONFIGS),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  logger.info(`Routing request for client: ${clientKey}`, { clientKey });

  const handler = createClientHandler(config);
  return handler(req);
});
