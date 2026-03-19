

# SMS Verification + Full Application Link After Unanswered Call

## Status: ✅ IMPLEMENTED

## Overview
When an AI agent call goes unanswered (`no_answer` on first attempt), the system sends an SMS that verifies the short application details (mirroring the phone verification), then after confirmation, sends a link to complete the full application.

## Flow
```text
Call → no_answer (retry_count === 0, consent_to_sms = 'yes', not enriched)
  ↓
SMS #1: "Hi {name}! We tried calling about the application you submitted to {client_name}. Confirm your details..."
  ↓
YES → SMS #2: Full application link (/apply/detailed?job_id=X&app_id=Y)
EDIT → SMS #3: Instructions to reply with corrections
STOP → Opt-out (consent_to_sms set to 'no')
```

## Changes Made

### Database
- Added `sms_followup_sent` boolean column to `outbound_calls` (default false)
- Created `sms_verification_sessions` table with status enum (pending_confirmation, confirmed, edit_requested, expired)

### Edge Functions
1. **Created** `supabase/functions/sms-webhook/index.ts` — Twilio incoming SMS handler (YES/EDIT/STOP)
2. **Updated** `supabase/functions/elevenlabs-outbound-call/index.ts` — triggers verification SMS on first `no_answer`
3. **Updated** `supabase/functions/send-sms/index.ts` — made conversationId/messageId optional

### Frontend
4. **Updated** `src/hooks/useDetailedApplicationForm.ts` — reads `app_id` from URL params, fetches existing application to pre-fill

### Config
5. **Updated** `supabase/config.toml` — added `sms-webhook` with `verify_jwt = false`

## Twilio Webhook Setup Required
Configure the Twilio phone number's incoming message webhook URL to:
`https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/sms-webhook`
