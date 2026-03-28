/**
 * Indeed XML Feed — DEPRECATED
 * 
 * This endpoint now redirects to the canonical Indeed feed at:
 *   universal-xml-feed?format=indeed
 * 
 * Kept alive to avoid breaking existing feed subscriptions with Indeed.
 * All new integrations should use universal-xml-feed?format=indeed directly.
 */

import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('indeed-xml-feed');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const organizationId = url.searchParams.get('organization_id');

    // Build canonical redirect URL
    const canonicalBase = url.origin.replace('indeed-xml-feed', 'universal-xml-feed');
    const redirectUrl = new URL(canonicalBase);
    redirectUrl.searchParams.set('format', 'indeed');
    if (organizationId) {
      redirectUrl.searchParams.set('organization_id', organizationId);
    }

    // Forward all other query params
    for (const [key, value] of url.searchParams.entries()) {
      if (key !== 'format' && key !== 'organization_id') {
        redirectUrl.searchParams.set(key, value);
      }
    }

    logger.info('Redirecting to canonical Indeed feed', { redirectUrl: redirectUrl.toString() });

    // Use 301 Permanent Redirect so crawlers update their bookmarks
    return new Response(null, {
      status: 301,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl.toString(),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    logger.error('Redirect error', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><error><message>Internal server error</message></error>`,
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
      }
    );
  }
});
