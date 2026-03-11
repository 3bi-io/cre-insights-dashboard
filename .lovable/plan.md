

## Bug: Schedule settings not persisting

### Root Cause

I traced the full save flow and found the likely issue: **the UPDATE operation silently fails (returns 0 rows) but the UI still shows "Schedule settings saved"**.

Here is the evidence:
- The DB shows `updated_at` dates of March 9-10, meaning no writes have succeeded since then (today is March 11)
- The mutation uses `.update().eq('id', ...).select().maybeSingle()` — if RLS blocks the write, PostgREST returns **0 rows with no error**
- When `savedRow` is null, `onSuccess` skips the cache update, but the toast still fires saying "saved"
- Then `onSettled` invalidates the query, refetching the old (unchanged) data from the DB
- The `useEffect` that syncs the form depends on `settingsKey` (id-based), which doesn't change, so the form keeps showing the user's edits
- When navigating away and back, the component remounts and loads the old DB data — revealing the failed save

**Why the write fails silently**: There are duplicate UPDATE RLS policies. While that alone shouldn't cause issues, the core problem is that a silent 0-row update is treated as success. Additionally, the `has_role()` function requires `organization_id` matching on the `user_roles` table, whereas `get_current_user_role()` (used for UI gating) does NOT check organization_id — so a mismatch could cause the UI to show the Schedule tab while RLS blocks the actual writes.

### Fix (2 files + 1 SQL migration)

**1. `src/features/elevenlabs/hooks/useCallScheduleSettings.ts`** — Detect and handle silent write failures:
- After UPDATE: if `savedRow` is null, throw an error ("Update failed — settings were not saved")
- After INSERT: same null check
- This ensures `onError` fires, rolling back the optimistic update and showing an error toast

**2. SQL migration** — Fix the potential RLS mismatch by creating a `SECURITY DEFINER` function that performs the upsert directly, bypassing row-level policies:
- Create `upsert_call_schedule_settings(p_organization_id, p_client_id, p_updates)` as a `SECURITY DEFINER` function
- Inside the function, verify the caller is admin/super_admin for that organization
- Perform the INSERT ON CONFLICT UPDATE and RETURN the saved row
- This eliminates the silent failure mode entirely

**3. `src/features/elevenlabs/hooks/useCallScheduleSettings.ts`** — Call the new RPC instead of raw table operations:
- Replace the select-then-insert/update logic with a single `supabase.rpc('upsert_call_schedule_settings', { ... })` call
- The RPC returns the saved row directly, making the flow much simpler and more reliable

### Summary

| Change | Purpose |
|--------|---------|
| Add null-check after UPDATE/INSERT | Detect silent write failures immediately |
| Create `upsert_call_schedule_settings` RPC | Single reliable write path with built-in auth check |
| Simplify mutation to use RPC | Eliminate race conditions and RLS bypass issues |

