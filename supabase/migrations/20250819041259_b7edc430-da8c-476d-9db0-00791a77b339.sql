-- Enable required extensions (safe if already enabled)
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

-- Schedule the ElevenLabs history import every 3 hours
select
  cron.schedule(
    'import-elevenlabs-history-every-3-hours',
    '0 */3 * * *',
    $$
    select
      net.http_post(
        url := 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/import-elevenlabs-history',
        headers := jsonb_build_object(
          'Content-Type','application/json',
          'Authorization','Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'agentId','agent_01jwedntnjf7tt0qma00a2276r'
        )
      ) as request_id;
    $$
  );