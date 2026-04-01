

## Plan: Add `raw_payload` Capture Across All Inbound Handlers

### Problem
Only `hayes-garrison-zapier` stores `raw_payload`. Four other inbound paths silently discard the original payload, making it impossible to debug field mapping issues or verify what partners actually sent.

### Changes

#### 1. `supabase/functions/_shared/hayes-client-handler.ts`
In `processApplication()` (line ~278–298), add `raw_payload: data` to the `applicationData` object being passed to `insertApplication`. The `data` parameter already contains the full inbound POST body.

#### 2. `supabase/functions/ziprecruiter-webhook/index.ts`
In the insert block (line ~291–315), add `raw_payload: body` to the `.insert()` call. The `body` variable holds the original webhook payload parsed at the top of the handler.

#### 3. `supabase/functions/cdl-jobcast-inbound/index.ts`
In `handleApplicationForward()` (line ~286–333), add `raw_payload: body` to the `enrichedBody` before forwarding to `inbound-applications`. This ensures the downstream handler receives it.

#### 4. `supabase/functions/inbound-applications/index.ts`
Find the application insert call and add `raw_payload: body` (or equivalent parsed request body variable) to the insert payload.

#### 5. `supabase/functions/submit-application/index.ts`
Find the application insert call and add `raw_payload: body` (the validated request body) to the insert payload. This captures applies from the `/apply` form, ZipRecruiter redirects, embeds, and all other front-door sources.

### Files changed (5)
- `supabase/functions/_shared/hayes-client-handler.ts` — add `raw_payload: data`
- `supabase/functions/ziprecruiter-webhook/index.ts` — add `raw_payload: body`
- `supabase/functions/cdl-jobcast-inbound/index.ts` — pass `raw_payload` through forwarded body
- `supabase/functions/inbound-applications/index.ts` — add `raw_payload` to insert
- `supabase/functions/submit-application/index.ts` — add `raw_payload` to insert

### No migration needed
The `raw_payload JSONB NULL` column already exists from the previous migration.

