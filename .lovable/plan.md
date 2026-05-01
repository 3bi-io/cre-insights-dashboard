## Goal

Send every application tied to the Hayes organization (`84214b48-7b51-45bc-ad7f-723bcf50466c`) — including all of its sub-clients (Danny Herman, Pemberton, Day & Ross, Novco, James Burg, R.E. Garrison) — to:

`POST https://bxsihfkpifqlteteredg.supabase.co/functions/v1/applyai-apply`

Both **historical** applications (one-time backfill) and **new/future** applications (real-time).

## Approach

Build one shared dispatcher and call it from two places: the live Hayes inbound flow and a one-time backfill function.

### 1. New shared module: `supabase/functions/_shared/applyai-webhook.ts`

A single helper `sendToApplyAI(supabase, application, options)` that:
- Builds the documented payload (`job_id`, `application_id`, `first_name`, `last_name`, `email`, `phone`, `city`, `state`, `zip`, `answers`, `utm`).
  - `job_id` = the `job_listings.job_id` (external feed id) when present, else fall back to `job_listing_id`.
  - `email` = `applicant_email`.
  - `answers` = compact object with `cdl`, `cdl_class`, `exp`, `driving_experience_years`.
  - `utm` = `{ source: utm_source, medium: utm_medium, campaign: utm_campaign }`.
- POSTs JSON with headers `Content-Type: application/json` and `X-ApplyAI-Secret: <APPLYAI_WEBHOOK_SECRET>` (if secret is set).
- Logs the attempt to `webhook_logs` (existing table) with response status + truncated body, tagging `trigger_event = 'hayes_to_applyai'` so we can audit.
- Never throws — returns `{ ok, status, error? }` so it can run inside `EdgeRuntime.waitUntil` without breaking the application insert.

### 2. Real-time delivery — patch `_shared/hayes-client-handler.ts`

In `processApplication`, after the existing `autoPostToATS` waitUntil call, add:

```ts
EdgeRuntime.waitUntil(
  sendToApplyAI(supabase, { id: applicationId, ...applicationData, job_external_id: jobResult.job_id })
);
```

This automatically covers all six Hayes client endpoints (`hayes-danny-herman-inbound`, `hayes-pemberton-inbound`, `hayes-dayross-inbound`, `hayes-novco-inbound`, `hayes-jamesburg-inbound`, `hayes-inbound`) because they all funnel through `createClientHandler`.

### 3. Historical backfill — new function `supabase/functions/hayes-applyai-backfill/index.ts`

Admin-only POST endpoint (verify caller has admin role via JWT, like existing admin functions). Behavior:

- Pulls all applications where `job_listings.organization_id = HAYES_ORG_ID`, paginated 500 at a time, oldest first.
- Optional body params: `dry_run` (default `true` for first call), `limit`, `since` (date), `client_id` (filter to one Hayes client).
- For each row, calls `sendToApplyAI` sequentially with a 100ms delay (gentle on the receiver).
- Tracks per-application result in a new tracking column / table so retries skip already-delivered rows.

### 4. Idempotency tracking

Add a column to `applications`: `applyai_webhook_status text` (`pending|sent|failed`) + `applyai_webhook_sent_at timestamptz` + `applyai_webhook_last_error text`. The dispatcher sets these after each attempt; the backfill skips rows where `applyai_webhook_status = 'sent'`.

### 5. Secret

Add `APPLYAI_WEBHOOK_SECRET` to Supabase Edge Function secrets (only if ApplyAI gives us one — otherwise we omit the header). I'll prompt for it before deploying.

## Out of scope

- Resume base64 upload — current Hayes inbound flow doesn't store resumes, so `resume`/`resume_filename` are omitted.
- Non-Hayes organizations — the dispatcher is gated on `HAYES_ORG_ID` so it won't fire elsewhere.

## Files touched

- **new** `supabase/functions/_shared/applyai-webhook.ts`
- **edit** `supabase/functions/_shared/hayes-client-handler.ts` (add waitUntil call)
- **new** `supabase/functions/hayes-applyai-backfill/index.ts`
- **new** migration adding `applyai_webhook_*` columns to `applications`
- **edit** `supabase/config.toml` to register the new function with `verify_jwt = true`

## Rollout

1. Apply migration.
2. Deploy shared helper + edited Hayes handler → all NEW Hayes apps start flowing immediately.
3. Run backfill with `dry_run=true` to see counts, then again with `dry_run=false` to actually send historical apps in batches.

## Question before I start

Did ApplyAI provide a shared secret value for the `X-ApplyAI-Secret` header? If yes I'll request it via the secrets tool; if no I'll send without that header.
