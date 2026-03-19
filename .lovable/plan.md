

# Refactor Twilio Integration for Local Number

## Problem
Four edge functions independently fetch Twilio credentials and construct raw API calls with duplicated code. With the switch to a local number (resolving error 30032), this is a good time to centralize the Twilio integration.

## Current State
Direct Twilio API calls with `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` appear in:
1. `sms-webhook/index.ts` (sendReply helper, lines 117-149)
2. `elevenlabs-outbound-call/index.ts` (inline SMS send, lines 443-499)
3. `send-sms/index.ts` (full SMS send with logging, lines 102-140)
4. `sms-auth/index.ts` (sendMagicLink + makeCall, lines 123-240)

Each function duplicates: credential fetching, URL construction, Basic Auth header, error handling, and phone normalization.

## Plan

### Step 1: Create shared Twilio client utility
**File**: `supabase/functions/_shared/twilio-client.ts`

A centralized module that:
- Fetches `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` once
- Exports `sendSms(to, body, from?)` — normalizes phone via existing `phone-utils.ts`, sends via Twilio REST API, returns `{ sid, success, error? }`
- Exports `makeCall(to, twiml, from?)` — same pattern for voice calls
- Exports `getTwilioCredentials()` — for edge cases needing raw access
- Includes structured logging via `createLogger('twilio-client')`
- Handles error responses consistently (parses Twilio error codes)

### Step 2: Refactor `sms-webhook/index.ts`
Replace lines 116-149 (credential fetch + `sendReply` helper) with import of `sendSms` from shared client. The `sendReply` closure becomes a one-liner.

### Step 3: Refactor `elevenlabs-outbound-call/index.ts`
Replace lines 443-499 (inline Twilio SMS block) with `sendSms()` call. Remove inline phone normalization (shared client handles it).

### Step 4: Refactor `send-sms/index.ts`
Replace lines 100-140 (credential fetch + Twilio fetch) with `sendSms()`. Keep the existing logging and status update logic around it.

### Step 5: Refactor `sms-auth/index.ts`
Replace credential fetching and raw API calls in both `sendMagicLink` and `makeCall` functions with `sendSms()` and `makeCall()` from the shared client.

## Files Changed

| File | Action |
|------|--------|
| `supabase/functions/_shared/twilio-client.ts` | **Create** — shared Twilio SMS/call utility |
| `supabase/functions/sms-webhook/index.ts` | **Edit** — use shared `sendSms` |
| `supabase/functions/elevenlabs-outbound-call/index.ts` | **Edit** — use shared `sendSms` |
| `supabase/functions/send-sms/index.ts` | **Edit** — use shared `sendSms` |
| `supabase/functions/sms-auth/index.ts` | **Edit** — use shared `sendSms` and `makeCall` |

## No secrets or DB changes needed
The same three Twilio env vars are used; they're just read from one place now. No schema changes required.

