/**
 * Shared Twilio Client - Centralized SMS and Voice Call utility
 * All edge functions should use this instead of direct Twilio API calls.
 */

import { normalizePhone } from './phone-utils.ts';
import { createLogger } from './logger.ts';

const logger = createLogger('twilio-client');

export interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export interface TwilioSmsResult {
  success: boolean;
  sid?: string;
  error?: string;
  errorCode?: number;
}

export interface TwilioCallResult {
  success: boolean;
  sid?: string;
  error?: string;
  errorCode?: number;
}

/**
 * Fetch and validate Twilio credentials from environment variables.
 * Throws if any credential is missing.
 */
export function getTwilioCredentials(): TwilioCredentials {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const phoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!accountSid || !authToken || !phoneNumber) {
    throw new Error('Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)');
  }

  return { accountSid, authToken, phoneNumber };
}

/**
 * Check if Twilio credentials are available without throwing.
 */
export function hasTwilioCredentials(): boolean {
  try {
    getTwilioCredentials();
    return true;
  } catch {
    return false;
  }
}

function buildAuthHeader(creds: TwilioCredentials): string {
  return `Basic ${btoa(`${creds.accountSid}:${creds.authToken}`)}`;
}

/**
 * Send an SMS via Twilio REST API.
 * @param to - Destination phone number (any format, will be normalized to E.164)
 * @param body - SMS message body (max 1600 chars)
 * @param from - Optional override for the From number (defaults to TWILIO_PHONE_NUMBER)
 */
export async function sendSms(to: string, body: string, from?: string): Promise<TwilioSmsResult> {
  const creds = getTwilioCredentials();

  const normalizedTo = normalizePhone(to);
  if (!normalizedTo) {
    return { success: false, error: `Invalid phone number: ${to}` };
  }

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Messages.json`;

  const response = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      'Authorization': buildAuthHeader(creds),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: normalizedTo,
      From: from || creds.phoneNumber,
      Body: body,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    logger.error('Twilio SMS error', undefined, {
      status: response.status,
      error_code: result.code,
      to_masked: normalizedTo.slice(0, -4) + '****',
    });
    return {
      success: false,
      error: result.message || `Twilio error (HTTP ${response.status})`,
      errorCode: result.code,
    };
  }

  logger.info('SMS sent', { sid: result.sid, to_masked: normalizedTo.slice(0, -4) + '****' });
  return { success: true, sid: result.sid };
}

function escapeXML(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Initiate a voice call via Twilio REST API with TwiML.
 * @param to - Destination phone number (any format, will be normalized to E.164)
 * @param twimlOrMessage - Either raw TwiML string or a plain-text message (will be wrapped in <Say>)
 * @param from - Optional override for the From number
 */
export async function makeCall(to: string, twimlOrMessage: string, from?: string): Promise<TwilioCallResult> {
  const creds = getTwilioCredentials();

  const normalizedTo = normalizePhone(to);
  if (!normalizedTo) {
    return { success: false, error: `Invalid phone number: ${to}` };
  }

  // If the input doesn't look like TwiML, wrap it in a Say element
  const twiml = twimlOrMessage.trim().startsWith('<?xml') || twimlOrMessage.trim().startsWith('<Response')
    ? twimlOrMessage
    : `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">${escapeXML(twimlOrMessage)}</Say></Response>`;

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Calls.json`;

  const response = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      'Authorization': buildAuthHeader(creds),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: normalizedTo,
      From: from || creds.phoneNumber,
      Twiml: twiml,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    logger.error('Twilio Call error', undefined, {
      status: response.status,
      error_code: result.code,
      to_masked: normalizedTo.slice(0, -4) + '****',
    });
    return {
      success: false,
      error: result.message || `Twilio call error (HTTP ${response.status})`,
      errorCode: result.code,
    };
  }

  logger.info('Call initiated', { sid: result.sid, to_masked: normalizedTo.slice(0, -4) + '****' });
  return { success: true, sid: result.sid };
}
