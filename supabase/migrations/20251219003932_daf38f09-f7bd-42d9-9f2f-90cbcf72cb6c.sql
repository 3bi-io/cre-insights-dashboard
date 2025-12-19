-- Clean up orphaned queued records that have initiated/completed counterparts for the same application
-- First, identify and delete queued records that have a corresponding initiated/completed record
DELETE FROM outbound_calls
WHERE id IN (
  SELECT oc1.id
  FROM outbound_calls oc1
  WHERE oc1.status = 'queued'
    AND EXISTS (
      SELECT 1 
      FROM outbound_calls oc2 
      WHERE oc2.application_id = oc1.application_id 
        AND oc2.id != oc1.id
        AND oc2.status IN ('initiated', 'initiating', 'in_progress', 'completed', 'failed', 'no_answer', 'busy')
    )
);

-- Update stuck 'initiated' calls to 'completed' if they've been initiated for more than 1 hour
-- This is a fallback for calls where we didn't receive a webhook callback
UPDATE outbound_calls
SET 
  status = 'completed',
  completed_at = NOW(),
  updated_at = NOW()
WHERE status = 'initiated'
  AND updated_at < NOW() - INTERVAL '1 hour'
  AND elevenlabs_conversation_id IS NOT NULL;