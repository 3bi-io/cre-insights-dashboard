

## Two Issues Found

### Issue 1: 403 on `organization_call_settings` upsert (org admins)

**Root cause**: Two problems in the upsert flow:

1. **Missing INSERT policy**: RLS has UPDATE and SELECT for org admins, but no INSERT. Supabase upsert requires both INSERT and UPDATE policies. Only super_admins have ALL access.
2. **Wrong `onConflict`**: The hook uses `onConflict: 'organization_id'` but the unique constraint was changed to `(organization_id, COALESCE(client_id, '00000000-...'))`. The conflict target must include `client_id`.

**Fix**:
- Add an INSERT policy for org admins on `organization_call_settings`
- Update the UPDATE policy's `WITH CHECK` clause (currently null -- needs one)
- Change `onConflict` in the hook from `'organization_id'` to `'organization_id,client_id'`

### Issue 2: 400 on `elevenlabs_transcripts` (URL too long)

**Root cause**: `useElevenLabsConversations.tsx` line 95 passes 600+ UUIDs into `.in('conversation_id', conversationIds)`, generating a GET URL that exceeds the ~8KB URL limit, returning a 400.

**Fix**: Batch the `.in()` query into chunks of 100 IDs, then merge results. Alternatively, use an RPC or skip transcript counts for large result sets.

### Plan

**Migration** (1 file):
- Add INSERT policy for org admins: `organization_id = get_user_organization_id() AND has_role(auth.uid(), 'admin')`
- Add WITH CHECK to existing UPDATE policy

**Hook fix** (`useCallScheduleSettings.ts`):
- Change `onConflict: 'organization_id'` to `'organization_id,client_id'`

**Transcript batching** (`useElevenLabsConversations.tsx`):
- Batch the `.in()` call into chunks of 100 conversation IDs
- Merge transcript count results across batches

