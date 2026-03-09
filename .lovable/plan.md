

## Fix: 400 Bad Request on `organization_call_settings` upsert

### Root Cause

The unique index is functional:
```sql
CREATE UNIQUE INDEX uq_org_call_settings_org_client 
  ON organization_call_settings (organization_id, COALESCE(client_id, '00000000-...'));
```

PostgREST's `upsert` with `onConflict` only works with simple column-based unique constraints, not functional indexes. This causes the 400.

### Solution

Two-part fix:

**1. Database migration**: Replace the functional unique index with a standard unique constraint. Add a `NOT NULL DEFAULT` for `client_id` using the sentinel UUID, so we don't need `COALESCE`. Alternatively (simpler, less disruptive): add a plain unique constraint on `(organization_id, client_id)` alongside making `client_id` default to the sentinel UUID instead of NULL.

Actually, the cleanest approach: drop the COALESCE-based index and create a proper composite unique constraint. To handle NULLs, we set `client_id` to have a default sentinel value `'00000000-0000-0000-0000-000000000000'` instead of NULL, and update existing NULL rows.

**Wait** — that changes the SQL query semantics (`WHERE client_id IS NULL` won't work anymore). Better approach:

**Replace upsert with select-then-insert/update in the hook.** This avoids the PostgREST limitation entirely and requires no schema changes.

### Plan: Update `useCallScheduleSettings.ts`

Replace the `.upsert()` call with:
1. Query for existing row matching `organization_id` + `client_id` (or `IS NULL`)
2. If found → `.update()` with `.eq()` filters
3. If not found → `.insert()`

This is ~10 lines of change in the mutation function, no migration needed.

### Files Modified
- `src/features/elevenlabs/hooks/useCallScheduleSettings.ts` — replace upsert with select+insert/update logic

