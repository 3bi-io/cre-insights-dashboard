

# Fix Stuck Outbound Calls: Cron Repair and Backlog Cleanup

## Summary

Two database operations to fix the broken `sync_initiated` cron job and clear all stuck records.

## Part 1: Fix the Cron Job

The `sync-stuck-outbound-calls` cron (job #4) uses Vault lookups for `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, which return `null`. This causes every execution to fail with a not-null constraint violation.

**Fix:** Use `cron.alter_job` to replace the command with hardcoded URL and anon key, matching the pattern used by all other working cron jobs (#3, #6, #7, #8, #9, #10).

```sql
SELECT cron.alter_job(
  4,
  schedule := '*/5 * * * *',
  command := $$
    SELECT net.http_post(
      url := 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/elevenlabs-outbound-call',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGci...anon_key...'
      ),
      body := '{"sync_initiated": true}'::jsonb
    );
  $$
);
```

## Part 2: Mark ALL Stuck Records as Failed

Instead of only cleaning pre-February records and waiting for the cron to reconcile the rest, mark **all 957** stuck `initiated` records as `failed` immediately. This ensures a clean slate.

```sql
UPDATE outbound_calls
SET status = 'failed',
    error_message = 'Sync cron was broken - call status never reconciled',
    updated_at = now()
WHERE status = 'initiated';
```

**After cleanup:** 0 records in `initiated` status.

## Part 3: Verification

After both operations, run verification queries to confirm:
- Cron job #4 has the corrected command (no more Vault lookups)
- Zero outbound calls remain in `initiated` status
- All statuses are in terminal states (`completed`, `failed`, `cancelled`)
- The cron fires successfully on its next cycle (check edge function logs)

## Technical Notes

- No code changes needed -- only two SQL data operations via the insert tool
- The cron fix uses `cron.alter_job` which updates the existing job in-place
- The edge function `sync_initiated` logic itself is correct and will work for future calls once the cron is fixed
- New calls going forward will be properly reconciled every 5 minutes

