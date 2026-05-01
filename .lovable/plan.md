# Hayes → ApplyAI Outbound Webhook: Coverage Fix

## Confirmation (current state)

**Hayes outbound webhook is NOT firing for the vast majority of applications.**

Database evidence (org `84214b48-…-466c`):

| Scope | Total apps | `sent` | `failed` | `null` (never attempted) |
|---|---|---|---|---|
| All time | 1,096 | 0 | 0 | **1,096** |
| Last 14 days | ~250 | 0 | 0 | ~250 |

Sources currently bypassing ApplyAI dispatch: `TheTruckersReportJobs` (137), `Adzuna` (43), `ZipRecruiter` (39), `Direct Application` (9), `ElevenLabs` (5), `Meta` (5), `LevelUp` (4), `Indeed` (3), `JobCast` (2), `Embed Form` (1), etc.

### Why

`sendToApplyAI()` is wired into **only one** code path:

- `_shared/hayes-client-handler.ts` — used by the dedicated `hayes-pemberton-inbound`, `hayes-harpers-hotshot-inbound`, etc. endpoints.

It is **not** called from the paths real traffic actually uses:

- `submit-application` — main public apply form (Adzuna, ZipRecruiter, TruckersReport, Direct, Embed all flow here)
- `inbound-applications` — generic inbound (used by CDL Job Cast `inbound-applications?client_name=…`)
- `cdl-jobcast-inbound` — CDL Job Cast direct
- `hayes-garrison-zapier` — R.E. Garrison Zapier path
- ElevenLabs voice-app insertion paths

Result: every application created through these routes for a Hayes job listing is silently skipped.

## Plan

### 1. Centralize dispatch in the application processor
Add a `dispatchToApplyAIIfHayes()` helper in `_shared/application-processor.ts` (or a new `_shared/hayes-dispatch.ts`) that:
- Loads the resolved `job_listings` row to confirm `organization_id === HAYES_ORG_ID`.
- Calls `sendToApplyAI()` with all needed fields from the freshly created application.
- Runs inside `EdgeRuntime.waitUntil(...)` so it never blocks the caller response.
- Is idempotent: skips rows already marked `applyai_webhook_status = 'sent'`.

### 2. Wire it into every Hayes-capable entry point
Add a call right after the `applications` insert succeeds in:

- `supabase/functions/submit-application/index.ts`
- `supabase/functions/inbound-applications/index.ts`
- `supabase/functions/cdl-jobcast-inbound/index.ts`
- `supabase/functions/hayes-garrison-zapier/index.ts`
- Any ElevenLabs sync path that inserts Hayes applications (`sync-voice-applications`, etc. — verify during implementation)

The existing `hayes-client-handler.ts` already calls it; leave it as-is.

### 3. Backfill the 1,096 historical Hayes applications
Use the existing `hayes-applyai-backfill` function:
- First a dry run to confirm count.
- Then `dry_run: false, limit: 2000` (the function caps internally), repeated in pages until drained.

### 4. Add a lightweight monitor
Extend `monitor-feed-quality` (or add to morning digest) to flag when Hayes apps from the last 24h have `applyai_webhook_status IS NULL` — surfaces silent drops if a new entry point is added later.

## Technical notes

- `sendToApplyAI()` already records outcome on `applications` (`applyai_webhook_status`, `applyai_webhook_sent_at`, `applyai_webhook_last_error`) and writes to `webhook_logs`.
- Hayes detection: `job_listings.organization_id === '84214b48-7b51-45bc-ad7f-723bcf50466c'`. We already have `getOrganizationFromJobId()` for cases where the listing isn't joined yet.
- Use service-role client (`getServiceClient()`) for the dispatch lookup to avoid RLS surprises.
- All edge functions retain `verify_jwt` settings as currently configured in `config.toml`.

## Out of scope

- Schema changes — none needed; columns already exist.
- ApplyAI endpoint or secret rotation — `APPLYAI_WEBHOOK_SECRET` already in use.
- Retrying failed rows — covered by `hayes-applyai-backfill` with `retry_failed: true`.
