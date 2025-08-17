-- Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Unschedule existing job if it exists
DO $$
BEGIN
  PERFORM cron.unschedule('meta-leads-sync-every-6-hours');
EXCEPTION WHEN others THEN
  -- ignore if job doesn't exist
  NULL;
END$$;

-- Schedule the job every 6 hours at minute 0
select cron.schedule(
  'meta-leads-sync-every-6-hours',
  '0 */6 * * *',
  $$
  select net.http_post(
    url:='https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/meta-leads-cron',
    headers:='{"Content-Type": "application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
