

## Pull R.E. Garrison Jobs from Double Nickel API

### Problem
R.E. Garrison's jobs should be imported from Double Nickel using the tracking link IDs stored in the connection credentials. Currently the Double Nickel adapter only supports `test_connection` and `send_application` -- there is no `get_jobs` implementation.

### Challenge
Double Nickel does not publish API documentation. We need to discover the correct endpoint for fetching jobs. The existing integration authenticates via Auth0 `client_credentials` flow against `dashboard.getdoublenickel.com`.

### Approach

**Step 1: Probe the Double Nickel API for job endpoints**

Using the existing R.E. Garrison production credentials, make authenticated GET requests to likely endpoints:
- `GET /api/jobs`
- `GET /api/jobs?trackingLinkId={id}`
- `GET /api/tracking-links/{id}`
- `GET /api/tracking-links/{id}/jobs`
- `GET /api/openings`

This will be done via `supabase--curl_edge_functions` or a test edge function. Once we find the working endpoint and understand the response schema, we proceed.

**Step 2: Implement `getDoubleNickelJobs()` in the REST adapter**

Add a new private method to `rest-json-adapter.ts` that:
1. Authenticates via existing Auth0 token flow
2. Iterates over all `tracking_link_ids` from credentials
3. Fetches jobs for each tracking link
4. Returns normalized job data

**Step 3: Wire up the `get_jobs` action**

In `RESTJSONAdapter.sendApplication()` area, add a handler for `get_jobs` that routes Double Nickel to `getDoubleNickelJobs()`.

**Step 4: Build a sync edge function or cron**

Create a sync mechanism (similar to `sync-cdl-feeds`) that:
1. Looks up the R.E. Garrison Double Nickel connection
2. Calls `get_jobs` for each tracking link ID
3. Upserts results into `job_listings` with proper `client_id`, `organization_id`
4. Deactivates jobs no longer present in the API response

### Technical details

```text
Flow:
  Cron/Manual trigger
    → get DN connection for R.E. Garrison (client_id: be8b645e...)
    → Auth0 token (cached 24h)
    → For each tracking_link_id:
        GET /api/{endpoint}?trackingLinkId={id}
    → Parse response → upsert job_listings
    → Deactivate stale jobs
```

Files to modify:
- `supabase/functions/_shared/ats-adapters/rest-json-adapter.ts` -- add `getDoubleNickelJobs()` method
- New or existing edge function for the sync cron

### First step requires discovery
Before writing the sync code, I need to probe the API to find the correct endpoint. Do you know the Double Nickel API endpoint for fetching jobs, or should I try hitting common patterns with the existing credentials?

