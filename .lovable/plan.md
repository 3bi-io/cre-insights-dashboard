## CDL Job Cast Integration Review

### Where CDL Job Cast sends data
There are **two paths** CDL Job Cast uses into our system:

1. **Inbound apply forwarding** (CDL → us): single universal endpoint `POST /functions/v1/cdl-jobcast-inbound` (or its proxy `/inbound-applications?source=CDL Job Cast&client_name=…`). This endpoint resolves the client by `client_name` query param, then forwards the application to `inbound-applications`, which attaches it to the matching `job_listing_id`. Routing works via the job listing → client_id, not via a per-client URL.
2. **Outbound feed sync** (us → CDL): `sync-cdl-feeds` cron pulls XML feeds for each Hayes client every 5 minutes and stamps each job's `apply_url` with `utm_source=cdl_jobcast` + a per-client `utm_campaign`.

### All clients CDL Job Cast is currently configured for

Source of truth: `CDL_FEEDS` in `supabase/functions/sync-cdl-feeds/index.ts` and `HAYES_CLIENT_CONFIGS` in `supabase/functions/_shared/hayes-client-handler.ts`.

| Client | client_id | feed user code | Active CDL jobs | Last sync result | Recent apps (30d) |
|---|---|---|---|---|---|
| Admiral Merchants | 53d7dd20… | `admiral_merchants` | 521 | 102 jobs/sync ✅ | 1 |
| Danny Herman Trucking | 1d54e463… | `danny_herman_trucking` | 163 | 161 jobs/sync ✅ | 60 |
| Pemberton Truck Lines Inc | 67cadf11… | `Pemberton-Truck-Lines-1749741664` | 81 | **0 jobs** ⚠️ | 58 |
| Day and Ross | 30ab5f68… | `Day-and-Ross-1745523293` | 46 | **0 jobs** ⚠️ | 0 |
| Novco, Inc. | 4a9ef1df… | `Novco%2C-Inc.-1760547390` | 21 | **0 jobs** ⚠️ | 0 |
| James Burg Trucking | b2a29507… | `James-Burg-Trucking-Company-1770928232` | 19 | **0 jobs** ⚠️ | 0 |
| R.E. Garrison Trucking | be8b645e… | `RE-Garrison-Trucking-1760000000` | 0 | **0 jobs** ⚠️ | 1 |
| RG Transport | dfef4b27… | `rg_transport` | 18 | 18 jobs/sync ✅ | 0 |

Configured in `HAYES_CLIENT_CONFIGS` but **not in `CDL_FEEDS`** (so jobs are not being pulled even though the inbound handler exists):
- **Harpers Hotshot** — `feedUserCode: 'TBD'` (still placeholder).

Hayes clients that are NOT on CDL Job Cast at all: Trucks For You Inc, Church Transportation, Hayes AI Recruiting.

### Issues found

1. **Four feeds returning 0 jobs every cycle** (Pemberton, Day and Ross, Novco, James Burg) and **R.E. Garrison** — the `feed_sync_logs` show `jobs_in_feed:0` repeatedly, but each client has many active jobs already in our DB from earlier syncs. Without sync, those listings will go stale and apply URLs won't be refreshed. Likely causes: feedUserCode no longer valid at CDL Job Cast, or board name (`AIRecruiter`) doesn't match what CDL has provisioned for these accounts.
2. **Admiral Merchants drift** — 521 active jobs in DB but feed only returns 102 per sync. The other ~419 listings will eventually be deactivated unless the feed catches up. (In the most recent run logs we already see the deactivation pass triggering for Admiral with count:421.)
3. **Deactivation batch errors** — Recent logs show repeated `[sync-cdl-feeds] Failed to deactivate jobs batch — error: [object Object]`. The error object isn't being unwrapped (`errorMessage` field is logging the whole object), so we lose the real Postgres error. Need to log `deactivateError.message`/`.code`/`.details` correctly.
4. **Harpers Hotshot has no working feed** — `feedUserCode: 'TBD'` and missing from `CDL_FEEDS`. Inbound apps would still flow through `cdl-jobcast-inbound` if CDL posts with `client_name=Harpers Hotshot`, but no jobs are being imported.
5. **Inbound application client matching is loose** — `cdl-jobcast-inbound` does an `ilike '%clientName%'` match on `clients.name`. Names like "Novco, Inc." with commas/periods or "James Burg Trucking Company" (we just stripped the trailing space) need to match exactly what CDL sends. No current failures observed, but worth defensive normalization.

### Plan to fix

1. **Reach out to CDL Job Cast** to confirm the live `user` codes for the 5 underperforming feeds (Pemberton, Day and Ross, Novco, James Burg, R.E. Garrison). Update `CDL_FEEDS` in `sync-cdl-feeds/index.ts` and `feedUserCode` in `HAYES_CLIENT_CONFIGS` once confirmed.
2. **Get and wire Harpers Hotshot feed code**, then add an entry to `CDL_FEEDS` so its jobs sync.
3. **Fix deactivation error logging** in `sync-cdl-feeds/index.ts` so we surface the real reason (likely a "[]" empty-batch or a JSONB column issue). Replace the bare `error` object with `error.message`, `error.code`, and `error.details` and add a guard to skip empty batches.
4. **Add feed-health alerting**: when `feed_sync_logs.jobs_in_feed = 0` for a client across N consecutive runs, log a warning + push to an `admin_alerts` table (or reuse the existing alert flow). This catches credential rot the moment it happens instead of weeks later.
5. **Normalize inbound `client_name`** in `cdl-jobcast-inbound`: strip trailing punctuation/whitespace and add a hardcoded alias map (e.g. `Novco` → `Novco, Inc.`) before the `ilike` lookup, so future CDL renames don't silently misroute.
6. **Validate end-to-end**: after credentials are corrected, send a test application via `cdl-jobcast-inbound?client_name=…` for each of the 5 currently-zero clients and confirm it lands on the correct `client_id` with `applyai_webhook_status` populated.

### Out of scope
- Changing the apply pixel/UTM scheme.
- Adding new Hayes clients to CDL Job Cast that don't currently exist there (Trucks For You, Church, Hayes AI).
- Refactoring the ATS forwarding pipeline downstream of `inbound-applications`.
