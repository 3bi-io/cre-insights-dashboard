SELECT cron.schedule(
  'morning-digest-daily',
  '30 13 * * 1-5',
  $$
  SELECT net.http_post(
    url := 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/morning-digest',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1d2hjZHBwcGxkamxjYXh6c21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDg1NjAsImV4cCI6MjA2NTMyNDU2MH0._K3Se_I9Y5dGmV-42V4MJvj4AqSWouXRTXVArOVASdU"}'::jsonb,
    body := '{"action": "send_digest"}'::jsonb
  ) AS request_id;
  $$
);