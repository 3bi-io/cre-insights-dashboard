UPDATE outbound_calls 
SET status = 'queued', 
    error_message = 'Reset from stuck initiated state (no call_sid) after API key fix',
    updated_at = now()
WHERE status = 'initiated' 
  AND call_sid IS NULL;