-- Schedule daily CDL Job Cast feed sync at 6:00 AM UTC
SELECT cron.schedule(
  'sync-cdl-feeds-daily',
  '0 6 * * *',
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