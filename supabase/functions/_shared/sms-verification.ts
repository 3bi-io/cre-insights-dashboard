/**
 * Shared SMS Verification Follow-up Logic
 * 
 * Sends a verification SMS after voicemail/no_answer on first attempt.
 * Used by both elevenlabs-outbound-call (sync path) and 
 * elevenlabs-conversation-webhook (real-time path).
 */

import { createLogger } from './logger.ts';

const logger = createLogger('sms-verification');

interface SmsVerificationParams {
  callId: string;
  applicationId: string;
  organizationId: string | null;
  /** Already confirmed: sms_followup_sent === false, retry_count === 0 */
}

interface ApplicationData {
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  state: string | null;
  cdl: string | null;
  cdl_class: string | null;
  exp: string | null;
  phone: string | null;
  consent_to_sms: string | null;
  job_listing_id: string | null;
  enrichment_status: string | null;
  employment_history: unknown;
  ssn: string | null;
  date_of_birth: string | null;
  emergency_contact_name: string | null;
  convicted_felony: string | null;
  military_service: string | null;
  medical_card_expiration: string | null;
}

/**
 * Check if an application is already enriched (has detailed form data).
 */
function isApplicationEnriched(app: ApplicationData): boolean {
  return !!(
    (app.employment_history && (Array.isArray(app.employment_history) ? (app.employment_history as unknown[]).length > 0 : true)) ||
    app.ssn || app.date_of_birth || app.emergency_contact_name ||
    app.convicted_felony || app.military_service || app.medical_card_expiration ||
    app.enrichment_status === 'enriched'
  );
}

/**
 * Send a voicemail verification SMS for an outbound call.
 * 
 * Checks enrichment status, org feature toggle, builds personalized message,
 * sends via Twilio, and creates the sms_verification_session record.
 * 
 * @returns true if SMS was sent, false otherwise
 */
// deno-lint-ignore no-explicit-any
export async function sendVoicemailVerificationSms(
  supabase: any,
  params: SmsVerificationParams,
): Promise<boolean> {
  const { callId, applicationId, organizationId } = params;

  // Fetch application details
  const { data: appData } = await supabase
    .from('applications')
    .select('first_name, last_name, city, state, cdl, cdl_class, exp, phone, consent_to_sms, job_listing_id, enrichment_status, employment_history, ssn, date_of_birth, emergency_contact_name, convicted_felony, military_service, medical_card_expiration')
    .eq('id', applicationId)
    .single();

  if (!appData || appData.consent_to_sms === 'no' || !appData.phone) {
    return false;
  }

  if (isApplicationEnriched(appData)) {
    logger.info(`Application ${applicationId} already enriched - skipping SMS verification`);
    return false;
  }

  // Fetch client name and job title from job listing
  let clientName = 'our company';
  let jobTitle = 'driver';
  if (appData.job_listing_id) {
    const { data: jobData } = await supabase
      .from('job_listings')
      .select('title, job_title, client_id, clients(name)')
      .eq('id', appData.job_listing_id)
      .single();
    if (jobData?.clients && typeof jobData.clients === 'object' && 'name' in jobData.clients) {
      clientName = (jobData.clients as { name: string }).name;
    }
    if (jobData) {
      jobTitle = jobData.title || jobData.job_title || 'driver';
    }
  }

  // Check org-level SMS followup toggle
  if (organizationId) {
    const { data: orgFeature } = await supabase
      .from('organization_features')
      .select('enabled')
      .eq('organization_id', organizationId)
      .eq('feature_name', 'sms_followup')
      .maybeSingle();
    if (orgFeature && orgFeature.enabled === false) {
      return false;
    }
  }

  // Build personalized verification message
  const firstName = appData.first_name || 'there';
  const lastName = appData.last_name || '';
  const location = [appData.city, appData.state].filter(Boolean).join(', ') || 'Not provided';
  const cdlInfo = appData.cdl_class ? `Class ${appData.cdl_class}` : (appData.cdl || 'Not provided');
  const experience = appData.exp || 'Not provided';

  const verificationMsg = `Hi ${firstName}! We tried reaching you about your ${jobTitle} application with ${clientName}.\n\nHere's what we have:\n• Name: ${firstName} ${lastName}\n• Location: ${location}\n• CDL: ${cdlInfo}\n• Experience: ${experience}\n\nReply YES to confirm or EDIT to update.\nReply STOP to opt out.`;

  // Send via Twilio
  const { sendSms: sendTwilioSms, hasTwilioCredentials } = await import('./twilio-client.ts');

  if (!hasTwilioCredentials()) {
    logger.warn('Twilio credentials not configured - skipping SMS verification');
    return false;
  }

  const smsResult = await sendTwilioSms(appData.phone, verificationMsg);

  if (!smsResult.success) {
    logger.error(`Failed to send verification SMS for call ${callId}`, { error: smsResult.error });
    return false;
  }

  logger.info(`Verification SMS sent for call ${callId}`, { twilio_sid: smsResult.sid });

  // Normalize phone for session lookup
  const digits = appData.phone.replace(/[^\d]/g, '');
  const sessionPhone = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;

  // Create verification session
  await supabase.from('sms_verification_sessions').insert({
    application_id: applicationId,
    outbound_call_id: callId,
    phone_number: sessionPhone,
    status: 'pending_confirmation',
    verification_message: verificationMsg,
    client_name: clientName,
    job_listing_id: appData.job_listing_id,
    applicant_first_name: appData.first_name || null,
    job_title: jobTitle,
  });

  // Mark SMS followup as sent
  await supabase
    .from('outbound_calls')
    .update({ sms_followup_sent: true, updated_at: new Date().toISOString() })
    .eq('id', callId);

  return true;
}
