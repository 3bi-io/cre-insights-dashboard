-- Insert missing conversation records from outbound_calls into elevenlabs_conversations
INSERT INTO elevenlabs_conversations (conversation_id, agent_id, voice_agent_id, organization_id, status, started_at, ended_at, duration_seconds, metadata)
SELECT 
  oc.elevenlabs_conversation_id,
  va.elevenlabs_agent_id,
  oc.voice_agent_id,
  va.organization_id,
  CASE WHEN oc.status = 'completed' THEN 'done' ELSE oc.status END,
  oc.created_at,
  oc.completed_at,
  oc.duration_seconds,
  jsonb_build_object(
    'source', 'outbound_call',
    'outbound_call_id', oc.id,
    'application_id', oc.application_id,
    'phone_number', oc.phone_number
  )
FROM outbound_calls oc
JOIN voice_agents va ON va.id = oc.voice_agent_id
WHERE oc.elevenlabs_conversation_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM elevenlabs_conversations ec 
    WHERE ec.conversation_id = oc.elevenlabs_conversation_id
  );