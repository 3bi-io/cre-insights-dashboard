

# SMS Follow-Up After First Unanswered AI Call

## Overview
When the first AI agent call to a driver results in `no_answer`, automatically send a single SMS text message containing the key application details the agent was trying to confirm. Only one SMS per application — no spam.

## Prerequisites: Twilio Credentials
The project currently has **no Twilio secrets configured** (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` are missing). The existing `send-sms` and `sms-auth` functions reference them but they would fail today. We need these secrets added before SMS will work. There is also no Twilio connector linked.

## Database Changes

**1. Add `sms_followup_sent` boolean to `outbound_calls`**
- Default `false`. Set to `true` after the SMS is sent. Prevents duplicate texts.

**2. Add `sms_followup_enabled` boolean to `organization_call_settings`**
- Default `true`. Allows orgs to opt out of SMS follow-ups.

## Edge Function Changes

**`elevenlabs-outbound-call/index.ts`** — In the sync reconciliation block (lines 177-361), after a call is mapped to `no_answer`:

1. Check guard conditions:
   - `retry_count === 0` (first attempt only)
   - `sms_followup_sent === false` on the outbound call record
   - Org setting `sms_followup_enabled !== false`
   - Application has `consent_to_sms` = 'Yes' or 'yes'
   - Application has a valid phone number

2. Build SMS message from application data (same fields the agent uses):
   ```
   Hi {first_name}, this is {company_name} following up on your {job_title} application.
   We'd like to confirm a few details:
   - CDL: {cdl_class}
   - Location: {city}, {state}
   - Experience: {experience}
   Please call us back at {company_phone} or reply to this text.
   ```

3. Send via Twilio (using existing `TWILIO_*` env vars pattern from `send-sms` function)

4. Mark `sms_followup_sent = true` on the outbound call record

5. Log the SMS in `sms_messages` table for audit trail

## Guard Rails
- **One SMS per application**: The `sms_followup_sent` flag on the outbound call + a check for existing SMS messages for the same `application_id` ensures no duplicates
- **First call only**: Only triggers when `retry_count === 0` — subsequent no-answer retries don't send another text
- **Consent check**: Only sends if `consent_to_sms` is affirmative on the application
- **Org toggle**: `sms_followup_enabled` setting lets orgs disable this feature

## Files to Edit
- `supabase/functions/elevenlabs-outbound-call/index.ts` — Add SMS follow-up logic after `no_answer` detection in sync block
- Database migration — Add `sms_followup_sent` column and `sms_followup_enabled` setting

## Secret Requirements
Before this can work, Twilio credentials (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`) must be added as secrets, **or** the Twilio connector must be linked to the project.

