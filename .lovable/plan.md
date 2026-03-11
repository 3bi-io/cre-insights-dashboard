

## Bug: Schedule settings not persisting after save

### Root Cause

The `useCallScheduleSettings` hook's mutation (`updateSettings`) saves to the database but relies solely on `invalidateQueries` to refresh the UI. Two problems:

1. **No optimistic cache update** — after saving, the query is invalidated and refetches in the background. If the user navigates away before the refetch completes, the stale cached data persists.
2. **No `.select()` on upsert** — the mutation doesn't return the saved row, so we can't directly update the cache with confirmed server data.
3. **`useEffect([settings])` dependency** — React Query's structural sharing may not trigger a re-render if the refetched data shape is identical to what's already cached (e.g., when updating from defaults to the same values with an added `id`).

### Fix

**File: `src/features/elevenlabs/hooks/useCallScheduleSettings.ts`**

1. Add `.select().single()` to both the `update` and `insert` paths so the mutation returns the saved row.
2. In `onMutate`: optimistically update the query cache with the new values and return the previous snapshot for rollback.
3. In `onSuccess`: set query data directly from the returned server row (confirming the optimistic update).
4. In `onError`: rollback to the previous snapshot and show error toast.
5. Always `invalidateQueries` in `onSettled` to ensure eventual consistency.

**File: `src/components/voice/CallScheduleSettings.tsx`**

6. Add `settings` object identity check — use a stable key (e.g., `settings.id` or a hash) as the `useEffect` dependency instead of the whole `settings` object, ensuring the form re-syncs when the underlying record changes.

### Summary of Changes

| File | Change |
|------|--------|
| `useCallScheduleSettings.ts` | Add `.select().single()` to DB calls; implement optimistic update with rollback in `onMutate`/`onError`/`onSettled` |
| `CallScheduleSettings.tsx` | Stabilize `useEffect` dependency to reliably sync form from refetched settings |

