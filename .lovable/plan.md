

# Fix Broken Cron Jobs #3 and #8

## Problem

Two cron jobs have broken configurations preventing them from successfully calling their edge functions:

| Job | Name | Issue |
|-----|------|-------|
| #3 | `process-outbound-call-queue` | Uses `current_setting('supabase.anon_key', true)` which resolves to NULL at cron execution time |
| #8 | `meta-leads-sync-5min` | Missing `Authorization` header entirely |

The other 5 jobs (#4, #6, #7, #9, #10) are correctly configured with hardcoded Bearer tokens.

## Solution

Use the **unschedule + re-schedule** approach (avoids the `supabase_admin` ownership issue with `cron.alter_job`):

### Step 1: Fix Job #3 -- Outbound Call Queue

```sql
SELECT cron.unschedule('process-outbound-call-queue');

SELECT cron.schedule(
  'process-outbound-call-queue',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/elevenlabs-outbound-call',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1d2hjZHBwcGxkamxjYXh6c21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDg1NjAsImV4cCI6MjA2NTMyNDU2MH0._K3Se_I9Y5dGmV-42V4MJvj4AqSWouXRTXVArOVASdU'
    ),
    body := '{"process_queue": true, "limit": 10}'::jsonb
  ) AS request_id;
  $$
);
```

### Step 2: Fix Job #8 -- Meta Leads Sync

```sql
SELECT cron.unschedule('meta-leads-sync-5min');

SELECT cron.schedule(
  'meta-leads-sync-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/meta-leads-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1d2hjZHBwcGxkamxjYXh6c21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDg1NjAsImV4cCI6MjA2NTMyNDU2MH0._K3Se_I9Y5dGmV-42V4MJvj4AqSWouXRTXVArOVASdU'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## Technical Notes

- The `unschedule` function works by job **name** (not ID), which avoids the ownership issue that blocked `alter_job`
- The new jobs will be owned by the current user (`postgres`), making future modifications straightforward
- Schedules are preserved exactly: every 1 minute for #3, every 5 minutes for #8
- No code file changes needed -- this is purely a database-level fix via migration tool

## Verification

After execution, query `cron.job` to confirm both jobs now have hardcoded Bearer tokens in their commands.

