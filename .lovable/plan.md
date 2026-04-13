

# Fix: ElevenLabs API Key Not Accessible by Edge Function

## Problem
After updating the `ELEVENLABS_API_KEY` secret, the `elevenlabs-outbound-call` edge function is returning `"ELEVENLABS_API_KEY not configured"`. The secret exists in the vault but the running function instances can't read it — they need a fresh deployment to pick up the updated value.

## Steps

1. **Redeploy the edge function** — Deploy `elevenlabs-outbound-call` so it picks up the new `ELEVENLABS_API_KEY` secret value.

2. **Test the call** — Retry one of the stuck `initiated` calls (e.g., Lucy Hulon) to verify it connects successfully.

3. **Apply the body-level error detection fix** — Update `elevenlabs-outbound-call/index.ts` (~line 1247) to check for `success: false` in the ElevenLabs response body even when HTTP status is 200. This prevents calls from getting stuck in `initiated` status when ElevenLabs wraps Twilio auth errors in 200 responses.

4. **Reset stuck calls** — Update all calls currently in `initiated` status with no `call_sid` back to `queued` so they can be retried.

## Technical Detail
- The edge function reads `Deno.env.get('ELEVENLABS_API_KEY')` at line 197
- After a secret update, Supabase edge function instances may still cache the old (or empty) value until redeployed
- 5 calls are currently stuck in `initiated` status and need to be reset

