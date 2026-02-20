
## Fix Outbound Call Issues: Stale Scheduled Calls and Rapid-Fire Retry Spam Prevention

### Problem
1. An old scheduled call for Donnel Torrey (from the previous business-hours-gating logic) is set to fire at 9 AM CST tomorrow, even though Donnel already completed a 116-second call. This will cause an unwanted duplicate call.
2. Calls are being placed by ElevenLabs/Twilio successfully (conversation IDs and call SIDs are returned), but showing 0-second duration. Rapid back-to-back retries (within minutes) are likely causing carrier-level spam filtering, preventing the recipient's phone from actually ringing.

### Changes

#### 1. Clean Up Stale Scheduled Calls (Database)
- Cancel the orphaned scheduled call for Donnel Torrey (`61801eff`) that has `scheduled_at = 2026-02-20 15:00:00 UTC` and `business_hours_gated = true`.
- Add a broader cleanup: cancel any `scheduled` calls where the same `application_id` already has a `completed` call, preventing duplicate follow-ups to people who already spoke with the agent.

#### 2. Add Retry Delay to Auto-Retry Logic (Edge Function)
**File:** `supabase/functions/elevenlabs-outbound-call/index.ts`

In the sync section (around line 178), change the auto-retry from creating an immediate `queued` call to creating a `scheduled` call with a delay:

- Instead of `status: 'queued'`, set `status: 'scheduled'`
- Add `scheduled_at: NOW() + 15 minutes` for the first retry, `NOW() + 30 minutes` for the second retry
- This spacing prevents carrier spam filters from blocking rapid successive calls to the same number
- The existing queue processor already promotes `scheduled` calls whose `scheduled_at` has passed (lines 244-270)

#### 3. Skip Retries When a Completed Call Exists (Edge Function)
**File:** `supabase/functions/elevenlabs-outbound-call/index.ts`

Before creating an auto-retry (around line 178), check if a `completed` call already exists for the same `application_id`. If so, skip the retry entirely -- the candidate already talked to the agent.

### Technical Details

The auto-retry block (lines 178-223) currently inserts with:
```
status: 'queued'
```

It will change to:
```
status: 'scheduled',
scheduled_at: new Date(Date.now() + (currentRetry + 1) * 15 * 60 * 1000).toISOString()
```

A new check before the retry insert:
```typescript
// Don't retry if a completed call already exists for this application
const { data: completedCall } = await supabase
  .from('outbound_calls')
  .select('id')
  .eq('application_id', fullCall.application_id)
  .eq('status', 'completed')
  .limit(1)
  .single();

if (completedCall) {
  logger.info(`Skipping retry - completed call exists for application`);
  // skip retry
}
```

And a one-time SQL cleanup:
```sql
UPDATE outbound_calls 
SET status = 'cancelled', error_message = 'Cancelled: stale scheduled call from old gating logic'
WHERE status = 'scheduled' 
  AND application_id IN (
    SELECT application_id FROM outbound_calls WHERE status = 'completed'
  );
```
