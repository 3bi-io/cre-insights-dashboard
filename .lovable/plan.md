

## Backfill: Send Cody Forbes Application to Zapier

### What This Does
Creates a one-time edge function that fetches the Cody Forbes application from the database, builds the same Zapier payload format used by `submit-application`, and POSTs it to the Hub Group webhook endpoint. It also logs the delivery in `client_webhook_logs`.

### Implementation

**New File: `supabase/functions/backfill-webhook/index.ts`**

A simple edge function that:
1. Queries the `applications` table for Cody Forbes' application (by name + Hub Group job listing)
2. Builds the payload using the same field mapping as `buildZapierPayload` in submit-application
3. POSTs to `https://hooks.zapier.com/hooks/catch/23823129/u28navp/`
4. Logs the result in `client_webhook_logs` with the correct `webhook_id`
5. Returns success/failure response

The function will be invoked once manually from the frontend or via curl, then can be deleted.

### Payload Format
Uses the exact same structure as the live webhook path -- event metadata, personal info, location, screening fields, and `screening_answers` from `custom_questions`.

### Safety
- Only sends the single Cody Forbes application (hardcoded filter by name)
- Logs delivery in `client_webhook_logs` so it's auditable
- Marks `event_type` as `backfill` to distinguish from live submissions
- No database schema changes needed

### Scope
- 1 new edge function file: `supabase/functions/backfill-webhook/index.ts`
- Update `supabase/config.toml` to add the function config with `verify_jwt = false`

