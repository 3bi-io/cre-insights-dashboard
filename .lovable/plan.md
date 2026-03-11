

## Expand Follow-Up Rules Into a Fully Functional System

### Current State

The system has the pieces but several critical gaps:

1. **No queue-processing cron**: There's a cron (`sync-stuck-outbound-calls`) that syncs initiated → no_answer/completed every 5 min, and its sync logic auto-retries no_answer/busy calls. But **scheduled calls are never promoted to queued and processed** — there's no cron calling `{"process_queue": true}`.

2. **Duplicate follow-up paths**: The DB trigger `trigger_follow_up_outbound_call` AND the sync logic in the edge function both create follow-up calls for no_answer/busy. This can create duplicate retries.

3. **No follow-up for "failed" calls**: Failed calls (API errors, transient issues) don't get retried by the trigger (the trigger does handle `failed` status, but the edge function's own retry only covers transient 5xx errors during the same request).

4. **No "callback" handling**: When a failed/no_answer applicant calls back, the system doesn't reference the original conversation or application context.

5. **UI only shows basic settings**: Max attempts + delay hours. No per-status rules, no escalation path, no cooldown period.

### Plan

#### 1. Add Queue Processing Cron (SQL migration)
Create a `pg_cron` job that runs every 2 minutes calling the edge function with `{"process_queue": true}`. This is the **most critical missing piece** — without it, scheduled follow-ups never execute.

```sql
SELECT cron.schedule(
  'process-outbound-call-queue',
  '*/2 * * * *',
  $$ SELECT net.http_post(..., '{"process_queue": true}') $$
);
```

#### 2. Consolidate Follow-Up Logic (SQL migration)
Remove the DB trigger's follow-up insertion (`trigger_follow_up_outbound_call`) to prevent duplicate retries. The edge function's sync path already handles this correctly with completion guards and retry counting. Update the trigger to be a no-op for follow-ups (keep only the application-insert trigger).

#### 3. Add Follow-Up Rule Columns to `organization_call_settings` (SQL migration)
New columns for granular control:
- `follow_up_on_no_answer` (boolean, default true) — retry when no one picks up
- `follow_up_on_failed` (boolean, default true) — retry on API/transient failures  
- `follow_up_on_busy` (boolean, default true) — retry when line is busy
- `follow_up_delay_minutes` (integer, default 15) — first retry delay in minutes (replaces hours for faster follow-up)
- `follow_up_escalation_multiplier` (decimal, default 2.0) — each subsequent attempt multiplies the delay
- `cooldown_hours` (integer, default 24) — max window for all follow-up attempts before giving up
- `callback_reference_enabled` (boolean, default true) — when an applicant calls back, inject prior call context

Update the `upsert_call_schedule_settings` RPC to handle these new columns.

#### 4. Update Edge Function Sync Logic (`elevenlabs-outbound-call/index.ts`)
In the `sync_initiated` handler (lines 179-248), update the auto-retry logic to:
- Read the org's `organization_call_settings` to get per-status follow-up rules
- Respect `follow_up_on_no_answer`, `follow_up_on_failed`, `follow_up_on_busy` toggles
- Use escalating delays: `follow_up_delay_minutes * escalation_multiplier^attempt`
- Check cooldown window (don't retry if first call was > `cooldown_hours` ago)
- Use the org's `max_attempts` setting instead of hardcoded `MAX_RETRY = 3`
- Add `is_follow_up: true` and `original_call_id` to metadata for callback context injection

#### 5. Add Callback Context to Dynamic Variables (`elevenlabs-outbound-call/index.ts`)
When processing a follow-up call (metadata has `retry_of` or `triggered_by: 'auto_follow_up'`):
- Fetch the original call's conversation transcript summary
- Inject `is_follow_up: "yes"`, `follow_up_attempt: "2"`, `previous_call_outcome: "no_answer"` into dynamic variables
- This lets the ElevenLabs agent say "We tried reaching you earlier about the [job_title] position..."

#### 6. Expand the UI (`CallScheduleSettings.tsx` + `useCallScheduleSettings.ts`)
Add a new section under "Follow-Up Rules" with:
- Per-status toggles: "Retry on No Answer", "Retry on Failed", "Retry on Busy"
- First retry delay (minutes instead of hours for faster follow-up)
- Escalation multiplier slider (1x–4x)
- Cooldown window (hours)
- Callback context toggle
- Visual follow-up timeline preview showing when each attempt would fire

Update the hook's interface and form state to include all new fields.

### Summary

| Change | Purpose |
|--------|---------|
| Queue processing cron | Actually execute scheduled follow-ups |
| Consolidate follow-up trigger | Prevent duplicate retry calls |
| New DB columns + RPC update | Granular per-status follow-up rules |
| Edge function sync update | Read org settings, escalating delays, cooldown |
| Callback context in dynamic vars | Agent references prior call attempt |
| Expanded admin UI | Full control over follow-up behavior |

