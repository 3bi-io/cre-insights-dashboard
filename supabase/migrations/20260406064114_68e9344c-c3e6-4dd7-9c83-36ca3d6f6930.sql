-- Reschedule morning-digest cron from 13:30 UTC (7:30 AM CST) to 12:30 UTC (7:30 AM CDT)
-- During CST (Nov–Mar) this fires at 6:30 AM Central — acceptable seasonal drift.
SELECT cron.unschedule('morning-digest-daily');

SELECT cron.schedule(
  'morning-digest-daily',
  '30 12 * * 1-5',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/morning-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_ANON_KEY')
    ),
    body := '{"time":"' || now()::text || '"}'::jsonb
  ) AS request_id;
  $$
);