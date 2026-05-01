/**
 * ApplyAI Outbound Webhook Dispatcher
 *
 * Forwards Hayes (and any caller-specified) applications to the external
 * ApplyAI ingest endpoint. Designed to be safe inside EdgeRuntime.waitUntil:
 * never throws, always records the result on the application row.
 */

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.50.0';
import { createLogger } from './logger.ts';

const logger = createLogger('applyai-webhook');

const APPLYAI_ENDPOINT =
  'https://bxsihfkpifqlteteredg.supabase.co/functions/v1/applyai-apply';

export interface ApplyAIDispatchInput {
  applicationId: string;
  /** External feed job id (job_listings.job_id) — preferred. */
  jobExternalId?: string | null;
  /** Internal job_listings.id fallback when jobExternalId is missing. */
  jobListingId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  cdl?: string | null;
  cdlClass?: string | null;
  exp?: string | null;
  drivingExperienceYears?: number | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  /** Anything extra to drop into `answers`. */
  extraAnswers?: Record<string, unknown>;
}

export interface ApplyAIDispatchResult {
  ok: boolean;
  status?: number;
  error?: string;
}

function buildPayload(input: ApplyAIDispatchInput) {
  const answers: Record<string, unknown> = {
    cdl: input.cdl ?? undefined,
    cdl_class: input.cdlClass ?? undefined,
    exp: input.exp ?? undefined,
    driving_experience_years: input.drivingExperienceYears ?? undefined,
    ...(input.extraAnswers ?? {}),
  };
  // Strip undefined keys
  for (const k of Object.keys(answers)) {
    if (answers[k] === undefined || answers[k] === null) delete answers[k];
  }

  return {
    job_id: input.jobExternalId || input.jobListingId || null,
    application_id: input.applicationId,
    first_name: input.firstName ?? null,
    last_name: input.lastName ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    zip: input.zip ?? null,
    answers,
    utm: {
      source: input.utmSource ?? null,
      medium: input.utmMedium ?? null,
      campaign: input.utmCampaign ?? null,
    },
  };
}

/**
 * POST a single application to ApplyAI. Records status on the application row.
 */
export async function sendToApplyAI(
  supabase: SupabaseClient,
  input: ApplyAIDispatchInput
): Promise<ApplyAIDispatchResult> {
  const payload = buildPayload(input);
  const secret = Deno.env.get('APPLYAI_WEBHOOK_SECRET');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (secret) headers['X-ApplyAI-Secret'] = secret;

  let status: number | undefined;
  let ok = false;
  let errorMessage: string | undefined;
  let responseBody = '';

  try {
    const res = await fetch(APPLYAI_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    status = res.status;
    responseBody = (await res.text()).slice(0, 1000);
    ok = res.ok;
    if (!ok) {
      errorMessage = `HTTP ${status}: ${responseBody}`;
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
    logger.error('ApplyAI dispatch network error', err, {
      applicationId: input.applicationId,
    });
  }

  // Persist outcome on the application row
  try {
    await supabase
      .from('applications')
      .update({
        applyai_webhook_status: ok ? 'sent' : 'failed',
        applyai_webhook_sent_at: new Date().toISOString(),
        applyai_webhook_last_error: ok ? null : (errorMessage ?? 'unknown error'),
      } as Record<string, unknown>)
      .eq('id', input.applicationId);
  } catch (err) {
    logger.error('Failed to record ApplyAI dispatch status', err, {
      applicationId: input.applicationId,
    });
  }

  // Audit log (best-effort)
  try {
    await supabase.from('webhook_logs').insert({
      trigger_event: 'hayes_to_applyai',
      payload,
      response_status: status ?? 0,
      response_body: responseBody,
      error_message: ok ? null : errorMessage,
    } as Record<string, unknown>);
  } catch {
    // webhook_logs may not accept arbitrary inserts in some envs — ignore
  }

  if (ok) {
    logger.info('ApplyAI dispatch ok', { applicationId: input.applicationId, status });
  } else {
    logger.warn?.('ApplyAI dispatch failed', {
      applicationId: input.applicationId,
      status,
      error: errorMessage,
    });
  }

  return { ok, status, error: errorMessage };
}
