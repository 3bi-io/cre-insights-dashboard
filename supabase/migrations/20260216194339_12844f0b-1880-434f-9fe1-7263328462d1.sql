-- Part 1: Fix the cron job to use hardcoded URL/key instead of broken Vault lookups
SELECT cron.alter_job(
  4,
  schedule := '*/5 * * * *',
  command := $$
    SELECT net.http_post(
      url := 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/elevenlabs-outbound-call',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1d2hjZHBwcGxkamxjYXh6c21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDg1NjAsImV4cCI6MjA2NTMyNDU2MH0._K3Se_I9Y5dGmV-42V4MJvj4AqSWouXRTXVArOVASdU'
      ),
      body := '{"sync_initiated": true}'::jsonb
    );
  $$
);

-- Part 2: Mark ALL stuck 'initiated' records as failed
UPDATE outbound_calls
SET status = 'failed',
    error_message = 'Sync cron was broken - call status never reconciled',
    updated_at = now()
WHERE status = 'initiated';