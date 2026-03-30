

# Fix: Enable Supabase Realtime for Applications Table

## Root Cause
The `usePaginatedApplications` hook already has both a realtime subscription and 60s polling configured correctly in the code. However, the `applications` table is **not added to the Supabase realtime publication** (`supabase_realtime`). This means Supabase never broadcasts change events, so the realtime subscription silently receives nothing. The 60s polling should still work as a fallback -- if it's also not updating, there may be an additional issue with query key matching.

Currently **zero tables** are in the realtime publication.

## Plan

### 1. Add tables to the Supabase realtime publication
Run a database migration to add the `applications` and `elevenlabs_conversations` tables to the realtime publication so change events are actually broadcast:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE applications;
ALTER PUBLICATION supabase_realtime ADD TABLE elevenlabs_conversations;
```

This single migration fixes both the admin applications list and the voice conversations section.

### 2. Verify query key invalidation matches
The realtime handler invalidates `queryKeys.applications.all`, and the infinite query uses `queryKeys.applications.list(filters)`. Confirm that `queryKeys.applications.all` is a prefix of `queryKeys.applications.list(filters)` so that `invalidateQueries` with the prefix key correctly triggers refetch of the list query. If not, fix the invalidation key.

### 3. Reduce polling interval as immediate fix
As a belt-and-suspenders approach, reduce the `refetchInterval` from 60s to 30s to ensure faster updates even if realtime events are occasionally missed.

## Technical Details
- The realtime publication is a Postgres-level setting that controls which tables emit WAL events to the Supabase Realtime server.
- Without tables in the publication, `.on('postgres_changes', ...)` subscriptions connect successfully but never fire callbacks.
- This is why the client dashboard (which likely uses a different data path) appears to work while the admin applications list does not.

