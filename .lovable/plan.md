

## Plan: Test SMS to Jerry Hayes (256-452-3636)

### Problem
The `send-sms` edge function requires authentication, so we can't test it directly from the backend tools. We need a way to fire a test SMS to verify the Twilio pipeline is working.

### Approach: Temporary Test Edge Function

Create a minimal, short-lived edge function `test-sms` that:
1. Accepts a `to` and `message` parameter
2. Calls the shared `sendSms` from `twilio-client.ts` directly (no auth required)
3. Returns the Twilio response (SID or error)
4. Has `verify_jwt = false` so we can invoke it via `curl_edge_functions`

After confirming delivery, the function will be deleted.

### Changes

**1. Create `supabase/functions/test-sms/index.ts`**
- Minimal handler: parse `to` + `message` from JSON body
- Call `sendSms(to, message)` from shared Twilio client
- Return success/error response
- No auth, no rate limiting — test-only

**2. Add to `supabase/config.toml`**
- `[functions.test-sms]` with `verify_jwt = false`

**3. Deploy and invoke**
- Deploy `test-sms`
- Call with `to: "256-452-3636"` and a test message
- Verify Jerry receives the SMS

**4. Cleanup**
- Delete the `test-sms` function after confirming delivery

### Test Message
> "Hi Jerry! This is a test from the recruitment team verifying our messaging system. Please disregard — thank you!"

