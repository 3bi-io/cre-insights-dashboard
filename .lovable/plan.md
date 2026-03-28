

## Temporarily Increase Google Indexing Cron to Daily

### Context
- 613 jobs remain unindexed; at 400/run, ~2 daily runs will clear the backlog
- Current cron: `0 6 * * 0,3` (Sunday + Wednesday 6 AM UTC), job ID 17

### Approach: Self-Reverting Edge Function

Rather than manually updating the cron and hoping to remember to revert it, the function itself will check whether a backlog exists after each run and automatically switch the cron schedule.

### Changes

**1. Add auto-schedule logic to `google-indexing-weekly/index.ts`**

After the final summary is computed (around line 278), add logic that:
- Queries the count of active jobs where `last_google_indexed_at IS NULL` or `updated_at > last_google_indexed_at`
- If remaining unindexed jobs > 0 → ensure cron is set to daily (`0 6 * * *`)
- If remaining unindexed jobs = 0 → revert cron to twice-weekly (`0 6 * * 0,3`)
- Uses `cron.alter_job` or unschedule/reschedule via SQL to update the existing job ID 17
- Logs the schedule change

**2. Update cron schedule to daily now (SQL via Supabase)**

Run SQL to immediately switch to daily:
```sql
SELECT cron.alter_job(17, schedule := '0 6 * * *');
```

### Result
- Cron runs daily at 6 AM UTC starting immediately
- After each run, the function checks if backlog is cleared
- Once all jobs are indexed, it automatically reverts to `0 6 * * 0,3`
- No manual intervention needed

