## Goal

Resend every recent CDL Job Cast application from our system to ApplyAI (which routes into hayesrecruitinghub.com) so we can verify the connection is working end-to-end.

## What I found while investigating

I queried the database for Hayes-org applications since April 1:

| applyai_webhook_status | count | window |
|---|---|---|
| `NULL` (never attempted) | **718** | 2026-04-01 → 2026-04-30 |
| `failed` | **8** | all today, 2026-05-01 |
| `sent` | 0 | — |

So the existing Hayes → ApplyAI dispatch path has not actually been delivering anything. Even worse, the 8 most-recent attempts all failed with the same error from ApplyAI:

```
HTTP 400: {"error":"Invalid payload","details":{"job_id":["Invalid uuid"]}}
```

### Root cause

In `supabase/functions/_shared/applyai-webhook.ts` the payload is built as:

```ts
job_id: input.jobExternalId || input.jobListingId || null,
```

`jobExternalId` is `applications.job_id`, which for CDL Job Cast feed listings is an external feed code like `14235J19129` — not a UUID. ApplyAI's ingest endpoint requires a UUID, so every CDL Job Cast application is rejected.

We need to flip the priority so the internal `job_listings.id` (a real UUID) is sent first, with the external code carried as a separate field.

## Plan

### 1. Fix the payload (`_shared/applyai-webhook.ts`)

- Send `job_id = jobListingId` (UUID) as the primary identifier.
- Add an `external_job_id` field carrying the feed code (e.g. `14235J19129`) so ApplyAI / Hayes can still reconcile against their source system.
- Keep the `null` fallback so non-Hayes callers don't break.

```text
payload.job_id           = jobListingId (UUID)
payload.external_job_id  = jobExternalId (feed code, e.g. 14235J19129)
```

### 2. Verify with a single live send

- Call `hayes-applyai-backfill` with `dry_run: true, limit: 5, retry_failed: true` to confirm the candidate set.
- Then send one application live (`dry_run: false, limit: 1, retry_failed: true`) and confirm a `200` response from ApplyAI plus a `sent` row in `applications.applyai_webhook_status`.

### 3. Resend everything

Once the single send succeeds, run the backfill in batches:

```text
POST /functions/v1/hayes-applyai-backfill
{ "dry_run": false, "limit": 2000, "retry_failed": true, "since": "2026-04-01" }
```

`retry_failed: true` re-sends both the 718 never-attempted rows and the 8 `failed` ones. The function already paces 100ms between sends and is idempotent (skips anything marked `sent`).

### 4. Report results

Return a summary of `scanned / sent / failed` plus a SQL count grouped by `applyai_webhook_status` so we can confirm everything is in `sent` state.

## Out of scope

- The unrelated `job_listings_status_check` constraint errors visible in `sync-cdl-feeds` logs (a job-deactivation issue, not an application-delivery issue). I'll flag this separately if you want it fixed in the same pass.
- No schema/migration changes are needed for this task.

## Files to change

- `supabase/functions/_shared/applyai-webhook.ts` — swap job_id priority, add `external_job_id`.
- (Deploy) `hayes-applyai-backfill`, plus all functions importing `applyai-webhook.ts` so the new payload shape ships everywhere.
