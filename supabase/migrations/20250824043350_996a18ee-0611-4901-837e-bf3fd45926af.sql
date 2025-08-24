-- Disable recurring cron jobs that invoke the ElevenLabs history import function
-- This simply pauses them (active = false), preserving the job for potential reactivation
UPDATE cron.job
SET active = false
WHERE active = true
  AND command ILIKE '%functions/v1/import-elevenlabs-history%';

-- Optionally, to completely remove the job instead of pausing it, you could run:
-- SELECT cron.unschedule(jobid) FROM cron.job WHERE command ILIKE '%functions/v1/import-elevenlabs-history%';