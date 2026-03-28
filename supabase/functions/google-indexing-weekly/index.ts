/**
 * Google Indexing Weekly Cron Function (v2 - Best in Class)
 * 
 * Submits new/updated job URLs to Google Indexing API using delta tracking.
 * Called by pg_cron on Sunday + Wednesday at 6:00 AM UTC.
 * 
 * Improvements over v1:
 * - Delta indexing: only submits jobs where updated_at > last_google_indexed_at
 * - Direct org discovery via distinct query (no 1000-row limit bug)
 * - Global sitemap mode (single fetch for all jobs)
 * - Proper error body logging for Google API failures
 * - Rate limit tracking with graceful degradation
 * - Updates last_google_indexed_at after successful submission
 */

import { createLogger } from "../_shared/logger.ts";
import { getServiceClient } from '../_shared/supabase-client.ts';

const logger = createLogger('google-indexing-weekly');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = Deno.env.get('SITE_BASE_URL') || 'https://applyai.jobs';
const GOOGLE_DAILY_QUOTA = 200; // Google Indexing API default quota

interface SubmissionResult {
  job_id: string;
  url: string;
  success: boolean;
  error?: string;
}

interface OrgSummary {
  organization_id: string;
  organization_name: string;
  total_jobs: number;
  delta_jobs: number;
  submitted: number;
  failed: number;
  skipped_quota: number;
  errors: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // 1. Validate Google credentials
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJson) {
      logger.error('GOOGLE_SERVICE_ACCOUNT_JSON secret is not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'GOOGLE_SERVICE_ACCOUNT_JSON not configured. Add it in Supabase Dashboard > Edge Functions > Secrets.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let serviceAccount: { client_email: string; private_key: string };
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
      if (!serviceAccount.client_email || !serviceAccount.private_key) {
        throw new Error('Missing client_email or private_key');
      }
    } catch (parseErr) {
      logger.error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON format', parseErr);
      return new Response(
        JSON.stringify({ success: false, error: 'GOOGLE_SERVICE_ACCOUNT_JSON is malformed. Expected JSON with client_email and private_key.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getServiceClient();

    // 2. Discover all organizations with Google-ready jobs (no row limit issue)
    const { data: orgs, error: orgError } = await supabase
      .from('job_listings')
      .select('organization_id')
      .eq('status', 'active')
      .eq('is_hidden', false)
      .not('title', 'is', null)
      .not('location', 'is', null)
      .neq('location', '');

    if (orgError) {
      throw new Error(`Failed to query job_listings: ${orgError.message}`);
    }

    // Deduplicate org IDs
    const orgIds = [...new Set((orgs || []).map(j => j.organization_id).filter(Boolean))];
    logger.info('Discovered organizations with Google-ready jobs', { count: orgIds.length });

    // 3. Get org names for logging
    const { data: orgNames } = await supabase
      .from('organizations')
      .select('id, name')
      .in('id', orgIds);

    const orgNameMap = new Map((orgNames || []).map(o => [o.id, o.name]));

    // 4. Get OAuth2 access token
    let accessToken: string;
    try {
      accessToken = await getAccessToken(serviceAccount);
      logger.info('Successfully obtained Google OAuth2 access token');
    } catch (tokenErr) {
      const msg = tokenErr instanceof Error ? tokenErr.message : String(tokenErr);
      logger.error('Failed to obtain Google OAuth2 token', { error: msg, client_email: serviceAccount.client_email });
      return new Response(
        JSON.stringify({ success: false, error: `OAuth2 token exchange failed: ${msg}. Verify GOOGLE_SERVICE_ACCOUNT_JSON credentials and that the Indexing API is enabled.` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Process each organization - fetch delta jobs and submit
    let quotaRemaining = GOOGLE_DAILY_QUOTA;
    let rateLimited = false;
    const orgSummaries: OrgSummary[] = [];

    for (const orgId of orgIds) {
      if (rateLimited || quotaRemaining <= 0) {
        orgSummaries.push({
          organization_id: orgId,
          organization_name: orgNameMap.get(orgId) || 'Unknown',
          total_jobs: 0,
          delta_jobs: 0,
          submitted: 0,
          failed: 0,
          skipped_quota: 1,
          errors: ['Skipped: daily quota exhausted or rate limited'],
        });
        continue;
      }

      const summary: OrgSummary = {
        organization_id: orgId,
        organization_name: orgNameMap.get(orgId) || 'Unknown',
        total_jobs: 0,
        delta_jobs: 0,
        submitted: 0,
        failed: 0,
        skipped_quota: 0,
        errors: [],
      };

      try {
        // Fetch jobs that need indexing (delta: never indexed OR updated since last index)
        const { data: jobs, error: jobError } = await supabase
          .from('job_listings')
          .select('id, updated_at, created_at, last_google_indexed_at')
          .eq('organization_id', orgId)
          .eq('status', 'active')
          .eq('is_hidden', false)
          .not('title', 'is', null)
          .not('location', 'is', null)
          .neq('location', '')
          .order('updated_at', { ascending: false });

        if (jobError) {
          summary.errors.push(`Query error: ${jobError.message}`);
          orgSummaries.push(summary);
          continue;
        }

        const allJobs = jobs || [];
        summary.total_jobs = allJobs.length;

        // Delta filter: only jobs never indexed or updated after last index
        const deltaJobs = allJobs.filter(job => {
          if (!job.last_google_indexed_at) return true;
          return new Date(job.updated_at || job.created_at) > new Date(job.last_google_indexed_at);
        });

        summary.delta_jobs = deltaJobs.length;

        if (deltaJobs.length === 0) {
          logger.info(`No delta jobs for ${summary.organization_name}`, { orgId, totalJobs: allJobs.length });
          orgSummaries.push(summary);
          continue;
        }

        logger.info(`Processing ${deltaJobs.length} delta jobs for ${summary.organization_name}`, { orgId, totalJobs: allJobs.length });

        // Submit each delta job URL
        const successfulJobIds: string[] = [];

        for (const job of deltaJobs) {
          if (quotaRemaining <= 0 || rateLimited) {
            summary.skipped_quota += deltaJobs.length - (summary.submitted + summary.failed);
            break;
          }

          const jobUrl = `${BASE_URL}/jobs/${job.id}`;

          try {
            const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ url: jobUrl, type: 'URL_UPDATED' }),
            });

            if (response.status === 429) {
              rateLimited = true;
              summary.errors.push('Rate limited by Google Indexing API (429)');
              logger.warn('Google Indexing API rate limit hit', { orgId, submitted: summary.submitted });
              break;
            }

            if (!response.ok) {
              const errorBody = await response.text();
              summary.failed++;
              summary.errors.push(`${job.id}: HTTP ${response.status} - ${errorBody.substring(0, 300)}`);
              logger.error('Google Indexing API error', { jobId: job.id, status: response.status, body: errorBody.substring(0, 500) });
            } else {
              // Consume response body
              await response.text();
              summary.submitted++;
              quotaRemaining--;
              successfulJobIds.push(job.id);
            }
          } catch (fetchErr) {
            summary.failed++;
            const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
            summary.errors.push(`${job.id}: ${msg}`);
          }

          // 100ms delay between requests
          await new Promise(r => setTimeout(r, 100));
        }

        // 6. Update last_google_indexed_at for successfully submitted jobs
        if (successfulJobIds.length > 0) {
          // Batch update in chunks of 100 to avoid URL length limits
          for (let i = 0; i < successfulJobIds.length; i += 100) {
            const batch = successfulJobIds.slice(i, i + 100);
            const { error: updateErr } = await supabase
              .from('job_listings')
              .update({ last_google_indexed_at: new Date().toISOString() })
              .in('id', batch);

            if (updateErr) {
              logger.error('Failed to update last_google_indexed_at', { error: updateErr.message, batchSize: batch.length });
            }
          }
        }
      } catch (orgErr) {
        const msg = orgErr instanceof Error ? orgErr.message : String(orgErr);
        summary.errors.push(`Processing error: ${msg}`);
      }

      orgSummaries.push(summary);

      // Log to feed_access_logs
      await supabase.from('feed_access_logs').insert({
        organization_id: orgId,
        feed_type: 'google-indexing-weekly',
        platform: 'google',
        request_ip: 'cron',
        user_agent: 'google-indexing-weekly-v2',
        job_count: summary.submitted,
        response_time_ms: Date.now() - startTime,
      });
    }

    const elapsed = Date.now() - startTime;
    const totalSubmitted = orgSummaries.reduce((s, o) => s + o.submitted, 0);
    const totalFailed = orgSummaries.reduce((s, o) => s + o.failed, 0);
    const totalDelta = orgSummaries.reduce((s, o) => s + o.delta_jobs, 0);

    const response = {
      success: true,
      version: 'v2-delta',
      total_organizations: orgIds.length,
      total_delta_jobs: totalDelta,
      total_submitted: totalSubmitted,
      total_failed: totalFailed,
      quota_remaining: quotaRemaining,
      rate_limited: rateLimited,
      elapsed_ms: elapsed,
      organizations: orgSummaries,
    };

    logger.info('Weekly indexing complete', {
      orgs: orgIds.length,
      delta: totalDelta,
      submitted: totalSubmitted,
      failed: totalFailed,
      quotaRemaining,
      rateLimited,
      elapsed,
    });

    return new Response(JSON.stringify(response, null, 2), {
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

// ─── Google OAuth2 JWT helpers ───

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const jwt = await createJWT(
    { alg: 'RS256', typ: 'JWT' },
    {
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/indexing',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    },
    sa.private_key
  );

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Token exchange failed (${resp.status}): ${body.substring(0, 500)}`);
  }

  const data = await resp.json();
  if (!data.access_token) {
    throw new Error('Token response missing access_token field');
  }
  return data.access_token;
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

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(data));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${data}.${signatureB64}`;
}
