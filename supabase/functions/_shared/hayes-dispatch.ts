/**
 * Hayes → ApplyAI Dispatch Helper
 *
 * Centralized "is this a Hayes app? if so, forward to ApplyAI" check.
 * Safe to call from any application-insert path. Never throws.
 *
 * Usage (after a successful applications insert):
 *
 *   maybeDispatchHayesToApplyAI(supabase, application);
 *
 * The call is fire-and-forget — wrap it in EdgeRuntime.waitUntil(...) at the
 * call site if you want to guarantee it survives the response cycle.
 */

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.50.0';
import { createLogger } from './logger.ts';
import { sendToApplyAI } from './applyai-webhook.ts';

const logger = createLogger('hayes-dispatch');

const HAYES_ORG_ID = '84214b48-7b51-45bc-ad7f-723bcf50466c';

export interface ApplicationLike {
  id: string;
  job_listing_id?: string | null;
  job_id?: string | null;
  organization_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  applicant_email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  cdl?: string | null;
  cdl_class?: string | null;
  exp?: string | null;
  driving_experience_years?: number | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  applyai_webhook_status?: string | null;
}

/**
 * If the application belongs to the Hayes organization, forward it to the
 * ApplyAI ingest endpoint. Idempotent — already-sent rows are skipped.
 *
 * Returns `true` if a dispatch was attempted, `false` otherwise.
 */
export async function maybeDispatchHayesToApplyAI(
  supabase: SupabaseClient,
  application: ApplicationLike,
): Promise<boolean> {
  try {
    if (!application?.id) return false;
    if (application.applyai_webhook_status === 'sent') return false;

    // Resolve organization_id. Prefer the value already on the row, otherwise
    // look it up via job_listing_id.
    let organizationId = application.organization_id ?? null;
    if (!organizationId && application.job_listing_id) {
      const { data: listing } = await supabase
        .from('job_listings')
        .select('organization_id')
        .eq('id', application.job_listing_id)
        .maybeSingle();
      organizationId = (listing?.organization_id as string | null) ?? null;
    }

    if (organizationId !== HAYES_ORG_ID) return false;

    logger.info('Dispatching Hayes application to ApplyAI', {
      applicationId: application.id,
      jobListingId: application.job_listing_id,
      jobId: application.job_id,
    });

    await sendToApplyAI(supabase, {
      applicationId: application.id,
      jobExternalId: application.job_id ?? null,
      jobListingId: application.job_listing_id ?? null,
      firstName: application.first_name ?? null,
      lastName: application.last_name ?? null,
      email: application.applicant_email ?? null,
      phone: application.phone ?? null,
      city: application.city ?? null,
      state: application.state ?? null,
      zip: application.zip ?? null,
      cdl: application.cdl ?? null,
      cdlClass: application.cdl_class ?? null,
      exp: application.exp ?? null,
      drivingExperienceYears: application.driving_experience_years ?? null,
      utmSource: application.utm_source ?? null,
      utmMedium: application.utm_medium ?? null,
      utmCampaign: application.utm_campaign ?? null,
    });
    return true;
  } catch (err) {
    logger.error('maybeDispatchHayesToApplyAI failed', err, {
      applicationId: application?.id,
    });
    return false;
  }
}

export { HAYES_ORG_ID };
