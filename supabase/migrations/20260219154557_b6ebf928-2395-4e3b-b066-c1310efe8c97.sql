-- Reset initiated calls back to queued so the cron processor retries them one at a time
UPDATE outbound_calls 
SET status = 'queued', 
    updated_at = now(),
    metadata = metadata || jsonb_build_object('retry_reason', 'manual_retry_no_answer', 'original_initiated_at', updated_at)
WHERE status = 'initiated'
AND created_at >= '2026-02-17 00:00:00+00';