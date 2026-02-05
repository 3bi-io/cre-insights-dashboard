-- Remove duplicate cron jobs (keep only the 5-minute versions)
SELECT cron.unschedule('sync-cdl-feeds-daily');
SELECT cron.unschedule('meta-leads-sync-every-6-hours');