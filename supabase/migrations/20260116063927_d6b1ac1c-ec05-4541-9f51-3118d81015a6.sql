
-- Clean up corrupted phone number records and add retry tracking
UPDATE outbound_calls 
SET status = 'failed', 
    error_message = 'Invalid phone number format - data corruption',
    updated_at = now()
WHERE phone_number LIKE '%object Object%' 
   OR phone_number IS NULL 
   OR phone_number = ''
   OR LENGTH(phone_number) < 10;

-- Add retry_count column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'outbound_calls' AND column_name = 'retry_count'
    ) THEN
        ALTER TABLE outbound_calls ADD COLUMN retry_count integer DEFAULT 0;
    END IF;
END $$;

-- Add cron job for syncing stuck initiated calls every 5 minutes
SELECT cron.schedule(
  'sync-stuck-outbound-calls',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1) || '/functions/v1/elevenlabs-outbound-call',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
    ),
    body := '{"sync_initiated": true}'::jsonb
  );
  $$
);
