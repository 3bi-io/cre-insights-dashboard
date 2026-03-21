

# Send Test SMS to +18177572828

## What
Invoke the existing `send-sms` edge function to send a test message from +12566002580 to +18177572828.

## Approach
Use `supabase--curl_edge_functions` to call the `send-sms` function directly. Since this function requires authentication, I'll instead create a quick temporary `sms-test` edge function that calls the shared `sendSms` utility directly (no auth required), deploy it, invoke it, then delete it.

## Steps
1. Create `supabase/functions/sms-test/index.ts` — calls `sendSms("+18177572828", "Test message from ATS platform — Twilio integration verified! ✅")`
2. Deploy and invoke via curl
3. Delete the function after confirmation

## File
| File | Action |
|------|--------|
| `supabase/functions/sms-test/index.ts` | Create → Deploy → Invoke → Delete |

