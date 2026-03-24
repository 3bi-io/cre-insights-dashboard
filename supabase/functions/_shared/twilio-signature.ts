/**
 * Twilio Request Signature Validation
 * Validates incoming Twilio webhooks using HMAC-SHA1 signature verification.
 * See: https://www.twilio.com/docs/usage/security#validating-requests
 */

import { createLogger } from './logger.ts';

const logger = createLogger('twilio-signature');

/**
 * Validate a Twilio request signature.
 * @param authToken - Your Twilio Auth Token
 * @param signature - The X-Twilio-Signature header value
 * @param url - The full URL Twilio sent the request to
 * @param params - The POST parameters as a key-value object
 * @returns true if the signature is valid
 */
export async function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): Promise<boolean> {
  if (!signature || !authToken) {
    logger.warn('Missing signature or auth token for validation');
    return false;
  }

  // Sort params by key and concatenate key+value
  const sortedKeys = Object.keys(params).sort();
  let dataString = url;
  for (const key of sortedKeys) {
    dataString += key + params[key];
  }

  // HMAC-SHA1
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(dataString));
  const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

  const isValid = computedSignature === signature;
  if (!isValid) {
    logger.warn('Twilio signature mismatch', {
      expected_prefix: computedSignature.slice(0, 8) + '...',
      received_prefix: signature.slice(0, 8) + '...',
    });
  }

  return isValid;
}

/**
 * Extract Twilio webhook URL from request.
 * Uses X-Forwarded-Proto and Host headers to reconstruct the URL Twilio used.
 */
export function getWebhookUrl(req: Request): string {
  // Use the actual request URL — Supabase edge functions receive the full URL
  return req.url.split('?')[0];
}
