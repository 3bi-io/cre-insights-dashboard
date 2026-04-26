-- Activate scheduling-reminders cron (every minute)
-- Idempotent: unschedule if already exists, then re-create
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scheduling-reminders-every-minute') THEN
    PERFORM cron.unschedule('scheduling-reminders-every-minute');
  END IF;
END $$;

SELECT cron.schedule(
  'scheduling-reminders-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/scheduling-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1d2hjZHBwcGxkamxjYXh6c21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDg1NjAsImV4cCI6MjA2NTMyNDU2MH0._K3Se_I9Y5dGmV-42V4MJvj4AqSWouXRTXVArOVASdU"}'::jsonb,
    body := jsonb_build_object('time', now())
  );
  $$
);