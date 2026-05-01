## Goal

Create a strong `APPLYAI_WEBHOOK_SECRET`, store it as a Supabase Edge Function secret, and enforce it on the receiving `applyai-apply` endpoint so only callers with the shared header can post applications. Then surface the value once for you to share externally.

## Steps

1. **Generate the secret**
   - Run `openssl rand -hex 32` to produce a 64-char hex token (256 bits of entropy).
   - Print it once to chat so you can copy it and hand it to the external platform. (It will not be retrievable again from the dashboard — secrets are write-only after save.)

2. **Store as an Edge Function secret**
   - Add `APPLYAI_WEBHOOK_SECRET` via the secrets tool with the generated value.
   - This makes it available to:
     - `applyai-apply` (receiver — validates incoming `X-ApplyAI-Secret` header)
     - `_shared/applyai-webhook.ts` (sender — already reads the same env var; harmless here since we're the receiver, but consistent naming)

3. **Enforce on the receiver `applyai-apply`**
   - Read `Deno.env.get('APPLYAI_WEBHOOK_SECRET')` at request time.
   - If set, require incoming requests to include `X-ApplyAI-Secret` matching exactly. Reject mismatches with `401`.
   - If unset, allow through (keeps current behavior so we don't break anything before deploy).
   - I'll first `code--view supabase/functions/applyai-apply/index.ts` to confirm structure, then patch in the check at the top of the handler (after CORS preflight).

4. **Verification**
   - Use `supabase--curl_edge_functions` to send a test POST without the header → expect `401`.
   - Send the same POST with `X-ApplyAI-Secret: <value>` → expect `200`.

## Technical details

- Secret name: `APPLYAI_WEBHOOK_SECRET`
- Header name: `X-ApplyAI-Secret` (matches what's already documented and what the sender helper sends)
- Comparison: constant-time compare via `crypto.timingSafeEqual` on equal-length buffers to avoid timing leaks; fall back to length-mismatch reject.
- Rotation: to rotate later, generate a new value, update the secret, share with integrator, redeploy `applyai-apply` (per the edge-function deployment standard).

## What you'll need to do

Nothing — once approved, I'll generate the value, store it, wire the check, and paste the value in chat exactly once for you to forward to the external platform.
