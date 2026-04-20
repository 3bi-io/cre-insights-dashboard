

## Verification: Quick + Detailed application flows — status & required fixes

### Health of the application submission flows themselves: GREEN

Last 7 days, all sources, all clients:

| Metric | Result |
|---|---|
| Applications captured | 211 |
| Missing email | **0** |
| Missing first name | **0** |
| Missing phone | **0** |
| Stuck in `needs_enrichment` | **0** |

Quick (Direct Application + Embed Form) and Detailed submissions are flowing cleanly for **Danny Herman, Pemberton, James Burg, Hayes, R.E. Garrison, Admiral**. Detailed-form fields (`driving_experience_years`, `cdl_class`) are populating where the Detailed form is configured. Inbound partner sources (TheTruckersReportJobs, Adzuna, ZipRecruiter, JobCast) intentionally skip detailed fields and pass through enrichment — and enrichment is keeping up (0 stuck rows).

**No code bug in `submit-application` or the Quick/Detailed UI was found.**

### However — two real downstream issues uncovered while verifying

#### Issue 1 — `organization-api` is still 500ing (Hayes site → Admiral apps still hidden)

The earlier patch added `job_id` support, but Hayes' integrator doesn't call per-job — they call `GET /applications?client_id=<admiral_id>`. That code path still loads **all of Admiral's job_listing IDs** (~420), shoves them into a single `.in('job_listing_id', [...])`, and the request now fails with `TypeError: error sending request from 10.30.8.124:43260` (Postgrest connection blowing up under URL+payload size).

Hourly trend on `/applications`:

| Hour (UTC) | 200 | 500 |
|---|---|---|
| 13:00 | 449 | **727** |
| 14:00 | 505 | 26 |
| 15:00 | 420 | 16 |
| 16:00 | 285 | 12 |

Down from 727 → 12, but **Admiral specifically is still failing** because Admiral has the most job_listings of any Hayes client.

**Fix (edge function only):** in `supabase/functions/organization-api/index.ts` `handleApplications`, when scoping by `client_id`, **chunk the `job_listing_id` `.in()` into batches of ~100 IDs**, run them in parallel, merge + sort + paginate the results. Same fix on `handleStats` if it uses the same pattern. No DB changes.

#### Issue 2 — Admiral has 1 application with `tenstreet_sync_status='failed'`

Admiral isn't on Tenstreet — this row should not have been queued for Tenstreet at all. Likely the `auto-post-engine` is misrouting Admiral. Need to:

- Inspect that one failed Admiral row → confirm whether Tenstreet auto-post should be disabled for Admiral's client_id, or whether it failed for a transient reason.
- If Admiral's intended ATS is something else (or none/manual), make sure the `auto-post-engine` adapter map excludes Admiral's `client_id`.

### Files to change

- `supabase/functions/organization-api/index.ts` — chunk `client_id`-scoped applications query (and stats query if applicable). Improve error logging to include the Postgrest URL length so we can spot future overflows.
- `supabase/functions/_shared/ats-adapters/auto-post-engine.ts` (or the adapter map it imports) — only after confirming whether Admiral should ever auto-post to Tenstreet.

### Verification

1. After deploy: `GET /organization-api/applications?client_id=53d7dd20-d743-4d34-93e9-eb7175c39da1` → 200 with the 2 Admiral apps (Garey Ferguson SR, Brandon Pesta).
2. `api_request_logs` `/applications` 500 count → 0 within 30 min.
3. Hayes site → Admiral section → applications list populated.
4. Submit a fresh test app to a Pemberton, Danny Herman, and Admiral job → confirm row lands with all required fields and correct `source` attribution.
5. Re-check Admiral's `tenstreet_sync_status='failed'` row after auto-post fix — either retried & synced, or correctly skipped.

