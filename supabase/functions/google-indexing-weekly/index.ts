/**
 * Google Indexing Weekly Cron Function
 * Automatically submits all Google-ready job URLs to the Google Indexing API.
 * Designed to be called by pg_cron every Sunday at 6:00 AM UTC.
 * 
 * Flow:
 * 1. Query all orgs with active, non-hidden jobs that have title + location
 * 2. For each org, fetch the sitemap XML from google-jobs-xml edge function
 * 3. Parse <loc> URLs from the XML
 * 4. Submit each URL to Google Indexing API as URL_UPDATED
 * 5. Handle 429 rate limits gracefully (stop submitting, log remaining)
 * 6. Log results to feed_access_logs
 */

import { createLogger } from "../_shared/logger.ts";
import { getServiceClient } from '../_shared/supabase-client.ts';

const logger = createLogger('google-indexing-weekly');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

interface OrgResult {
  organization_id: string;
  organization_name: string;
  job_count: number;
  urls_submitted: number;
  urls_failed: number;
  errors: string[];
  rate_limited: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const results: OrgResult[] = [];
  let totalSubmitted = 0;
  let totalFailed = 0;
  let rateLimited = false;

  try {
    // Check for Google Service Account credentials
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJson) {
      logger.warn('GOOGLE_SERVICE_ACCOUNT_JSON not configured, skipping indexing');
      return new Response(
        JSON.stringify({ success: false, error: 'Google Service Account not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const supabase = getServiceClient();

    // Step 1: Find all organizations with Google-ready jobs
    const { data: orgJobs, error: orgError } = await supabase
      .from('job_listings')
      .select('organization_id, organizations!inner(name)')
      .eq('status', 'active')
      .eq('is_hidden', false)
      .not('title', 'is', null)
      .not('location', 'is', null)
      .neq('location', '');

    if (orgError) {
      throw new Error(`Failed to query organizations: ${orgError.message}`);
    }

    // Group by organization
    const orgMap = new Map<string, { name: string; count: number }>();
    for (const job of orgJobs || []) {
      const orgId = job.organization_id;
      if (!orgId) continue;
      const existing = orgMap.get(orgId);
      const orgName = (job as any).organizations?.name || 'Unknown';
      if (existing) {
        existing.count++;
      } else {
        orgMap.set(orgId, { name: orgName, count: 1 });
      }
    }

    logger.info('Found organizations with Google-ready jobs', { 
      orgCount: orgMap.size, 
      totalJobs: orgJobs?.length || 0 
    });

    // Step 2: Get OAuth2 access token (one token for all submissions)
    const accessToken = await getAccessToken(serviceAccount);

    // Step 3: Process each organization
    for (const [orgId, orgInfo] of orgMap) {
      if (rateLimited) {
        results.push({
          organization_id: orgId,
          organization_name: orgInfo.name,
          job_count: orgInfo.count,
          urls_submitted: 0,
          urls_failed: 0,
          errors: ['Skipped due to rate limiting on previous org'],
          rate_limited: true,
        });
        continue;
      }

      const orgResult: OrgResult = {
        organization_id: orgId,
        organization_name: orgInfo.name,
        job_count: orgInfo.count,
        urls_submitted: 0,
        urls_failed: 0,
        errors: [],
        rate_limited: false,
      };

      try {
        // Fetch sitemap XML for this org
        const sitemapUrl = `${SUPABASE_URL}/functions/v1/google-jobs-xml?organization_id=${orgId}`;
        const sitemapResp = await fetch(sitemapUrl, {
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });

        if (!sitemapResp.ok) {
          orgResult.errors.push(`Failed to fetch sitemap: ${sitemapResp.status}`);
          results.push(orgResult);
          continue;
        }

        const xmlText = await sitemapResp.text();

        // Parse <loc> URLs from sitemap XML
        const urls: string[] = [];
        const locRegex = /<loc>(.*?)<\/loc>/g;
        let match;
        while ((match = locRegex.exec(xmlText)) !== null) {
          if (match[1]) {
            // Unescape XML entities
            const url = match[1].trim()
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'");
            urls.push(url);
          }
        }

        logger.info(`Parsed ${urls.length} URLs for org ${orgInfo.name}`, { orgId });

        // Submit each URL to Google Indexing API
        for (const url of urls) {
          if (rateLimited) {
            orgResult.rate_limited = true;
            break;
          }

          try {
            const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ url, type: 'URL_UPDATED' }),
            });

            if (response.status === 429) {
              rateLimited = true;
              orgResult.rate_limited = true;
              orgResult.errors.push('Rate limited by Google Indexing API');
              logger.warn('Rate limited by Google Indexing API', { orgId, submitted: orgResult.urls_submitted });
              break;
            }

            if (!response.ok) {
              const errorText = await response.text();
              orgResult.urls_failed++;
              totalFailed++;
              orgResult.errors.push(`${url}: ${response.status} ${errorText.substring(0, 200)}`);
            } else {
              orgResult.urls_submitted++;
              totalSubmitted++;
            }
          } catch (fetchError) {
            orgResult.urls_failed++;
            totalFailed++;
            const msg = fetchError instanceof Error ? fetchError.message : String(fetchError);
            orgResult.errors.push(`${url}: ${msg}`);
          }

          // Small delay between requests to be respectful of rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (orgError) {
        const msg = orgError instanceof Error ? orgError.message : String(orgError);
        orgResult.errors.push(`Org processing error: ${msg}`);
      }

      results.push(orgResult);

      // Log to feed_access_logs for this org
      await supabase.from('feed_access_logs').insert({
        organization_id: orgId,
        feed_type: 'google-indexing-weekly',
        platform: 'google',
        request_ip: 'cron',
        user_agent: 'google-indexing-weekly-cron',
        job_count: orgResult.urls_submitted,
        response_time_ms: Date.now() - startTime,
      });
    }

    const elapsed = Date.now() - startTime;

    const summary = {
      success: true,
      total_organizations: orgMap.size,
      total_urls_submitted: totalSubmitted,
      total_urls_failed: totalFailed,
      rate_limited: rateLimited,
      elapsed_ms: elapsed,
      organizations: results,
    };

    logger.info('Weekly indexing complete', {
      orgs: orgMap.size,
      submitted: totalSubmitted,
      failed: totalFailed,
      rateLimited,
      elapsed,
    });

    return new Response(JSON.stringify(summary, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Weekly indexing failed', error);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ─── Google OAuth2 JWT helpers (same pattern as google-indexing-trigger) ───

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

async function getAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  const jwtHeader = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const jwt = await createJWT(jwtHeader, jwtPayload, serviceAccount.private_key);

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to get access token: ${tokenResponse.statusText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function createJWT(
  header: Record<string, string>,
  payload: Record<string, unknown>,
  privateKey: string
): Promise<string> {
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const data = `${headerB64}.${payloadB64}`;

  const keyData = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');

  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(data)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${data}.${signatureB64}`;
}
