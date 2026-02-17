-- Issue 2A: Promote stuck scheduled calls with NULL scheduled_at
UPDATE outbound_calls 
SET status = 'queued', updated_at = NOW()
WHERE status = 'scheduled' AND scheduled_at IS NULL;

-- Issue 2C: Add organization_call_settings row for Hayes Recruiting
INSERT INTO organization_call_settings (organization_id)
VALUES ('84214b48-7b51-45bc-ad7f-723bcf50466c')
ON CONFLICT DO NOTHING;

-- Issue 3: Deactivate James Burg agent (no elevenlabs_agent_id)
UPDATE voice_agents 
SET is_active = false 
WHERE id = '23981299-ce34-47a3-9646-45bc09dba6f8' 
AND elevenlabs_agent_id IS NULL;

-- Issue 4: Deduplicate existing double records
WITH duplicates AS (
  SELECT id, application_id,
    ROW_NUMBER() OVER (PARTITION BY application_id, status ORDER BY created_at) as rn
  FROM outbound_calls
  WHERE status IN ('scheduled', 'queued')
)
UPDATE outbound_calls 
SET status = 'cancelled', updated_at = NOW()
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);