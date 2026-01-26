
# Clear Applications and Add Sync Cutoff Date

## Current Problem
The `sync-voice-applications` cron job fetches the last 100 conversations from ElevenLabs per agent and creates applications for any not already in the database. When you deleted all applications, the deduplication check (which looks for `Conversation ID:` in notes) failed, causing 55 historical conversations to be re-imported.

## Solution
1. Delete all applications
2. Add a cutoff date to the sync function so it only processes conversations that started **after** a specific timestamp
3. Re-enable the cron job

---

## Implementation Steps

### Step 1: Run SQL to Clear Applications

Execute this in Supabase SQL Editor:
```sql
-- Delete all applications
DELETE FROM applications;

-- Verify
SELECT COUNT(*) as remaining FROM applications;
```

### Step 2: Update `sync-voice-applications` Edge Function

**File:** `supabase/functions/sync-voice-applications/index.ts`

Add a cutoff date constant and filter conversations:

```typescript
// Add after line 6 (after logger creation)
const SYNC_CUTOFF_DATE = new Date('2026-01-26T19:00:00Z'); // Only sync conversations after this timestamp
```

Then add a filter inside the conversation processing loop (around line 123):

```typescript
for (const conv of conversations) {
  const convId = conv.conversation_id;
  syncResults.conversations_processed++;

  // Skip if already processed
  if (existingConversationIds.has(convId)) {
    continue;
  }

  // NEW: Skip conversations before cutoff date
  const convStartTime = conv.start_time ? new Date(conv.start_time) : null;
  if (convStartTime && convStartTime < SYNC_CUTOFF_DATE) {
    continue;
  }

  // ... rest of processing
}
```

### Step 3: Verify Cron Job is Active

The cron job should already be running. If it was unscheduled, re-enable it:
```sql
-- Check if cron job exists
SELECT * FROM cron.job WHERE jobname = 'sync-voice-applications-cron';

-- If missing, recreate it
SELECT cron.schedule(
  'sync-voice-applications-cron',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/sync-voice-applications',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1d2hjZHBwcGxkamxjYXh6c21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDg1NjAsImV4cCI6MjA2NTMyNDU2MH0._K3Se_I9Y5dGmV-42V4MJvj4AqSWouXRTXVArOVASdU"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/sync-voice-applications/index.ts` | Add `SYNC_CUTOFF_DATE` constant and filter logic |

---

## Expected Outcome

After implementation:
- All existing applications are cleared
- The sync function will **ignore** any ElevenLabs conversations that started before `2026-01-26T19:00:00Z`
- Only **new** voice conversations going forward will create applications
- The real-time webhook will continue to work normally for immediate application creation

---

## Alternative: Environment Variable Approach

Instead of hardcoding the cutoff date, we could use an environment variable:

```typescript
const SYNC_CUTOFF_DATE = Deno.env.get('VOICE_SYNC_CUTOFF_DATE') 
  ? new Date(Deno.env.get('VOICE_SYNC_CUTOFF_DATE')!)
  : null;

// Then in the filter:
if (SYNC_CUTOFF_DATE && convStartTime && convStartTime < SYNC_CUTOFF_DATE) {
  continue;
}
```

This would allow adjusting the cutoff without redeploying the function. The secret can be set in Supabase Dashboard > Settings > Edge Functions.
