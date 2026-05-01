/**
 * Hayes → ApplyAI Backfill
 *
 * Iterates over historical Hayes applications and forwards each one to the
 * ApplyAI ingest endpoint. Idempotent — rows already marked
 * `applyai_webhook_status = 'sent'` are skipped.
 *
 * POST body (all optional):
 *   {
 *     "dry_run":  true,            // default: true. Set false to actually send.
 *     "limit":    500,             // default: 500. Max rows to process this call.
 *     "since":    "2025-01-01",    // ISO date — only apps created on/after.
 *     "client_id": "<uuid>",       // restrict to one Hayes client
 *     "retry_failed": false        // also re-send rows currently marked 'failed'
 *   }
 *
 * Auth: requires a Supabase JWT belonging to a user with role 'admin'
 * or 'super_admin' in user_roles. verify_jwt = true is enforced in config.toml.
 */

import { createClient } from 'npm:@supabase/supabase-js@2.50.0';
import { getCorsHeaders, handleCorsPreflightIfNeeded } from '../_shared/cors-config.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { createLogger } from '../_shared/logger.ts';
import { sendToApplyAI } from '../_shared/applyai-webhook.ts';

const logger = createLogger('hayes-applyai-backfill');
const HAYES_ORG_ID = '84214b48-7b51-45bc-ad7f-723bcf50466c';

interface BackfillBody {
  dry_run?: boolean;
  limit?: number;
  since?: string;
  client_id?: string;
  retry_failed?: boolean;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const preflight = handleCorsPreflightIfNeeded(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, undefined, origin);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return errorResponse('Server configuration error', 500, undefined, origin);
  }

  // --- Authn / authz -------------------------------------------------------
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return errorResponse('Missing Authorization header', 401, undefined, origin);
  }

  const admin = createClient(supabaseUrl, serviceKey);

  // Allow service-role bypass (used for operator-triggered backfills from
  // trusted environments where no admin user JWT is available).
  const isServiceRole = token === serviceKey;

  if (!isServiceRole) {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return errorResponse('Invalid auth token', 401, undefined, origin);
    }
    const userId = userData.user.id;

    const { data: roleRows } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    const roles = (roleRows ?? []).map((r: { role: string }) => r.role);
    const isAllowed = roles.includes('admin') || roles.includes('super_admin');
    if (!isAllowed) {
      return errorResponse('Forbidden: admin role required', 403, undefined, origin);
    }
  }

  // --- Parse body ----------------------------------------------------------
  let body: BackfillBody = {};
  try {
    body = (await req.json()) as BackfillBody;
  } catch {
    body = {};
  }
  const dryRun = body.dry_run !== false; // default true for safety
  const limit = Math.min(Math.max(body.limit ?? 500, 1), 2000);
  const since = body.since ?? null;
  const clientFilter = body.client_id ?? null;
  const retryFailed = body.retry_failed === true;

  logger.info('Backfill starting', { dryRun, limit, since, clientFilter, retryFailed, userId });

  // --- Find candidate Hayes job_listings ----------------------------------
  let listingsQuery = admin
    .from('job_listings')
    .select('id')
    .eq('organization_id', HAYES_ORG_ID);
  if (clientFilter) listingsQuery = listingsQuery.eq('client_id', clientFilter);
  const { data: listings, error: listingsErr } = await listingsQuery;
  if (listingsErr) {
    return errorResponse(`Failed to load job_listings: ${listingsErr.message}`, 500, undefined, origin);
  }
  const listingIds = (listings ?? []).map((l: { id: string }) => l.id);
  if (listingIds.length === 0) {
    return successResponse({ scanned: 0, sent: 0, failed: 0, skipped: 0 }, 'No Hayes listings found', undefined, origin);
  }

  // --- Pull candidate applications, batched in chunks of 500 listing ids --
  const candidates: Array<Record<string, unknown>> = [];
  for (let i = 0; i < listingIds.length && candidates.length < limit; i += 500) {
    const chunk = listingIds.slice(i, i + 500);
    let q = admin
      .from('applications')
      .select(
        'id, job_listing_id, job_id, first_name, last_name, applicant_email, phone, city, state, zip, cdl, cdl_class, exp, driving_experience_years, utm_source, utm_medium, utm_campaign, applyai_webhook_status, created_at'
      )
      .in('job_listing_id', chunk)
      .order('created_at', { ascending: true })
      .limit(limit - candidates.length);
    // Skip already-sent. By default also skip 'failed'; include them when retry_failed=true.
    if (retryFailed) {
      // Send anything that's not already 'sent' (NULL, 'failed', 'pending' all eligible)
      q = q.or('applyai_webhook_status.is.null,applyai_webhook_status.neq.sent');
    } else {
      // Only send rows that have never been attempted successfully or at all
      q = q.or('applyai_webhook_status.is.null,applyai_webhook_status.eq.pending');
    }
    if (since) q = q.gte('created_at', since);
    const { data, error } = await q;
    if (error) {
      return errorResponse(`Failed to load applications: ${error.message}`, 500, undefined, origin);
    }
    candidates.push(...(data ?? []));
  }

  logger.info('Backfill candidates loaded', { count: candidates.length });

  if (dryRun) {
    return successResponse(
      {
        dry_run: true,
        candidate_count: candidates.length,
        first: candidates.slice(0, 3).map((c) => ({ id: c.id, created_at: c.created_at })),
      },
      `Dry run — would forward ${candidates.length} applications`,
      undefined,
      origin
    );
  }

  // --- Send sequentially with a small delay -------------------------------
  let sent = 0;
  let failed = 0;
  for (const app of candidates) {
    const result = await sendToApplyAI(admin, {
      applicationId: app.id as string,
      jobExternalId: (app.job_id as string | null) ?? null,
      jobListingId: (app.job_listing_id as string | null) ?? null,
      firstName: app.first_name as string | null,
      lastName: app.last_name as string | null,
      email: app.applicant_email as string | null,
      phone: app.phone as string | null,
      city: app.city as string | null,
      state: app.state as string | null,
      zip: app.zip as string | null,
      cdl: app.cdl as string | null,
      cdlClass: app.cdl_class as string | null,
      exp: app.exp as string | null,
      drivingExperienceYears: app.driving_experience_years as number | null,
      utmSource: app.utm_source as string | null,
      utmMedium: app.utm_medium as string | null,
      utmCampaign: app.utm_campaign as string | null,
    });
    if (result.ok) sent++;
    else failed++;
    // Gentle pacing
    await new Promise((r) => setTimeout(r, 100));
  }

  logger.info('Backfill complete', { scanned: candidates.length, sent, failed });

  return successResponse(
    { scanned: candidates.length, sent, failed, dry_run: false },
    `Backfill complete: sent ${sent}, failed ${failed}`,
    undefined,
    origin
  );
});
