

## Fix: applyai.jobs `organization-api` returns 500 on per-job fetches (Admiral visibility on Hayes site)

### Root cause — it's on our side, not upstream

The Hayes integrator's report blamed "upstream applyai.jobs," but **applyai.jobs is us** (`auwhcdpppldjlcaxzsme.supabase.co/functions/v1/organization-api`). Edge logs show their site is calling:

```
GET /organization-api/applications?job_id=<uuid>
```

…hundreds of times per minute. Every single one returns **500 `{"error":"Internal server error"}`**. Confirmed in `api_request_logs`: 829× 500s on `/applications` in the last hour vs 256× 200s.

`handleApplications` in `supabase/functions/organization-api/index.ts` only accepts `client_id` and `status` — it ignores `job_id`. But there's a worse bug: when no `client_id` is passed, it loads **every job_listing for the org** (Hayes has thousands), shoves them all into a single `.in('job_listing_id', jobIds)` query → hits the 8KB PostgREST URL limit → throws → caught → 500.

The 3 "failing job IDs" the integrator listed (`2ea2fcef…`, `a32ca96d…`, `37fc171d…`) are all Admiral jobs (`53d7dd20…`). They're not failing because of Admiral — they're failing because the per-job fetch path doesn't exist.

### Fix

Edit `supabase/functions/organization-api/index.ts`:

1. **`handleApplications`**: read `job_id` from the query string. When present:
   - Validate it's a UUID.
   - Confirm the job belongs to the caller's `organization_id` (security — don't let one org's API key read another org's apps).
   - Query applications scoped to that single `job_listing_id` only. Skip the giant `.in()`.

2. **`handleJobs`**: same — accept `?job_id=<uuid>` to return one job (with `application_count`), org-scoped. Cheap addition; matches the URL pattern the integrator is already using elsewhere.

3. **Better error logging**: the current `logger.error('Organization API error', err)` serializes to `[object Object]`. Replace with `err instanceof Error ? err.message + err.stack : JSON.stringify(err)` so future regressions are diagnosable from logs.

4. **Guard the unscoped path**: in `handleApplications`, if no `client_id` AND no `job_id` are provided AND the org has > 500 jobs, return `400 { error: 'client_id or job_id required for orgs with >500 jobs' }` instead of silently 500ing on the URL-length blowup.

No DB migration. No frontend changes. Pure edge-function patch.

### Verification

1. After deploy, hit:
   ```
   GET /organization-api/applications?job_id=2ea2fcef-67d4-47df-9232-b35092a3a6c1
   ```
   with the Hayes API key → expect `200 { applications: [...] }` (Admiral job — currently 0 apps, so empty array is correct).

2. Hit `?job_id=a32ca96d…` → 200, empty array (Admiral, no apps).

3. Hit with a job_id from a different org's API key → 404/403 (cross-org isolation).

4. Watch `api_request_logs` for 30 minutes — `/applications` 500 count should drop to ~0; 200 count should climb as Hayes resumes normal sync.

5. Hayes site → Admiral Merchants section → applications list should populate (currently 2 apps in last 30 days; `Garey Ferguson SR — Indeed`, `Brandon Pesta — ElevenLabs`).

### Files touched

- `supabase/functions/organization-api/index.ts` — add `job_id` handling on `/applications` and `/jobs`, fix error logging, guard unscoped large-org path.

### What does NOT change

- API key auth, rate limiting, CORS, allowed-origins logic — untouched.
- All other endpoints (`/clients`, `/stats`) — untouched.
- Database, RLS, frontend client portal — untouched.

