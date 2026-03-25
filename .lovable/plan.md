

## Plan: Recreate test-sms function and retry SMS to Jerry Hayes

### Problem
The `test-sms` edge function file was deleted during cleanup, but the config entry remains. No logs exist because the function wasn't deployed. The SMS never actually sent.

### Changes

**1. Recreate `supabase/functions/test-sms/index.ts`**
Minimal function that:
- Accepts `to` and `message` in JSON body
- Calls `sendSms()` from the shared Twilio client
- Returns the result (SID or error)
- No auth required (already `verify_jwt = false` in config)

**2. Deploy and invoke**
- Deploy the `test-sms` function
- Call it with `to: "256-452-3636"` and message: `"Hi Jerry! This is a test from the recruitment team verifying our messaging system. Please disregard — thank you!"`
- Verify success from the response

**3. Cleanup**
- Delete the function file after confirming delivery

### Technical Detail
The shared `sendSms` in `twilio-client.ts` handles phone normalization (`256-452-3636` → `+12564523636`) and Twilio API auth automatically. The function is a thin wrapper.

