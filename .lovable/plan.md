

## Update Feed Sync Schedules to 5 Minutes

### Overview

This plan will update the CDL feeds sync schedule from daily (6 AM UTC) to every 5 minutes, matching the voice applications sync frequency. I'll also trigger an immediate sync of all feeds.

### Current State

| Cron Job | Current Schedule | New Schedule |
|----------|-----------------|--------------|
| `sync-cdl-feeds-daily` | `0 6 * * *` (daily 6AM) | `*/5 * * * *` (every 5 min) |
| `sync-voice-applications-cron` | `*/5 * * * *` | No change |
| `meta-leads-sync-every-6-hours` | `0 */6 * * *` | `*/5 * * * *` (every 5 min) |

### Implementation Steps

1. **Update CDL Feeds Cron Schedule**
   - Modify the `sync-cdl-feeds-daily` job to run every 5 minutes
   - Rename to `sync-cdl-feeds-5min` for clarity

2. **Update Meta Leads Cron Schedule** 
   - Modify the `meta-leads-sync-every-6-hours` job to run every 5 minutes
   - Rename to `meta-leads-sync-5min` for clarity

3. **Trigger Immediate Sync**
   - The syncs have been initiated (CDL feeds and voice applications are now running in background)
   - Meta leads sync failed due to expired access token (requires re-authentication with Meta)

### SQL Commands to Execute

```sql
-- Update CDL feeds to sync every 5 minutes
SELECT cron.unschedule('sync-cdl-feeds-daily');

SELECT cron.schedule(
  'sync-cdl-feeds-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/sync-cdl-feeds',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1d2hjZHBwcGxkamxjYXh6c21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDg1NjAsImV4cCI6MjA2NTMyNDU2MH0._K3Se_I9Y5dGmV-42V4MJvj4AqSWouXRTXVArOVASdU'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Update Meta leads to sync every 5 minutes  
SELECT cron.unschedule('meta-leads-sync-every-6-hours');

SELECT cron.schedule(
  'meta-leads-sync-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/meta-leads-cron',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

### Status Update

- **CDL Feeds Sync**: Initiated (running in background)
- **Voice Applications Sync**: Initiated (running in background)
- **Meta Leads Sync**: Failed - access token expired (requires Meta re-authentication)

### Note on Meta Integration

The Meta leads sync is failing because the access token has expired. You'll need to re-authenticate with Meta in the admin dashboard to restore this functionality.

