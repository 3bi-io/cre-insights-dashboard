

# SMS Verification + Full Application Link After Unanswered Call

## Overview
When an AI agent call goes unanswered (`no_answer` on first attempt), send an SMS that first verifies the short application details (mirroring the phone verification), then after confirmation, sends a link to complete the full application.

## Flow
```text
Call → no_answer (retry_count === 0, consent_to_sms = 'yes', not enriched)
  ↓
SMS #1: Verification summary with YES/EDIT prompt
  ↓
YES → SMS #2: Full application link
EDIT → SMS #3: Instructions to call or reply with corrections
STOP → Opt-out
```

## SMS Message Templates

**Verification SMS:**
```
Hi {first_name}! We tried calling about the application you submitted to {client_name}. Please confirm your details:

Name: {first_name} {last_name}
Location: {city}, {state}
CDL: {cdl_status}
Experience: {experience}

Reply YES to confirm or EDIT to make changes.
```

**Confirmation + Link SMS:**
```
Thanks for confirming! Complete your full application here:
{link to /apply/detailed?job_id=X&app_id=Y}
Reply STOP to opt out.
```

**Edit SMS:**
```
Please call us at {phone} or reply with corrections (e.g. 'City: Dallas, CDL: Class A'). A recruiter will update your record.
```

## Changes Required

### 1. Database Migration
- Add `sms_followup_sent` boolean to `outbound_calls` (default false)
- Create `sms_verification_sessions` table: `id`, `application_id`, `outbound_call_id`, `phone_number`, `status` (enum: pending_confirmation, confirmed, edit_requested, expired), `verification_message`, `created_at`, `updated_at`, `expires_at`

### 2. Create `supabase/functions/sms-webhook/index.ts`
- Twilio incoming SMS handler (no JWT, validate Twilio signature)
- Looks up sender phone in `sms_verification_sessions`
- Parses YES → mark confirmed, send full app link
- Parses EDIT → mark edit_requested, send instructions
- Parses STOP → update `consent_to_sms` to 'no'
- Returns empty TwiML `<Response/>`

### 3. Edit `supabase/functions/elevenlabs-outbound-call/index.ts`
- On `no_answer` + `retry_count === 0` + `consent_to_sms === 'yes'` + not enriched:
  - Fetch application + client name (from `job_listings.clients.name`)
  - Build verification SMS using client name (not job title)
  - Send via Twilio
  - Create `sms_verification_sessions` record
  - Set `sms_followup_sent = true`

### 4. Edit `supabase/functions/send-sms/index.ts`
- Make `conversationId`/`messageId` optional for system-originated SMS

### 5. Edit `src/hooks/useDetailedApplicationForm.ts`
- Read `app_id` from URL query params for SMS link support
- Fetch existing application to pre-fill and trigger UPDATE flow

### 6. Edit `supabase/config.toml`
- Add `sms-webhook` with `verify_jwt = false`

## Files Summary
1. **Create** `supabase/functions/sms-webhook/index.ts`
2. **Edit** `supabase/functions/elevenlabs-outbound-call/index.ts`
3. **Edit** `supabase/functions/send-sms/index.ts`
4. **Edit** `src/hooks/useDetailedApplicationForm.ts`
5. **Edit** `supabase/config.toml`
6. **Migration** for `sms_followup_sent` + `sms_verification_sessions`

