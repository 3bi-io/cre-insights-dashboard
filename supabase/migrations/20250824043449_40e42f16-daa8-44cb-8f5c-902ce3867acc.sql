-- Disable the ElevenLabs history import cron job
SELECT cron.unschedule('import-elevenlabs-history-every-3-hours');