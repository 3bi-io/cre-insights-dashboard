

## Fix: 409 Conflict on schedule settings save

### Root Cause

The `organization_call_settings` table has **two unique constraints** that conflict:

1. `unique_org_call_settings` — `UNIQUE (organization_id)` — allows only ONE row per org total
2. `uq_org_call_settings_org_client` — `UNIQUE INDEX (organization_id, COALESCE(client_id, ...))` — allows one row per org+client combo

Constraint #1 is overly restrictive and prevents client-specific overrides. When the `upsert_call_schedule_settings` function uses `ON CONFLICT` targeting #2, PostgreSQL detects the violation on #1 first and throws a 409 error.

### Fix

**Single SQL migration:**

1. **Drop** the `unique_org_call_settings` constraint (the one on `organization_id` alone) — it's redundant and blocks per-client overrides
2. Keep the functional unique index `uq_org_call_settings_org_client` which correctly handles the org+client uniqueness

No frontend changes needed — the hook and RPC function are already correct.

