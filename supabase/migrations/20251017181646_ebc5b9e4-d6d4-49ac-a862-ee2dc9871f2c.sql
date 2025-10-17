-- Restore CR England voice agent
INSERT INTO voice_agents (
  organization_id,
  agent_id,
  agent_name,
  voice_id,
  description,
  is_active,
  llm_model,
  elevenlabs_agent_id
)
SELECT 
  id,
  'agent_1501k4dpkf2hfevs6eh5e7947a65',
  'CR England Recruitment Agent',
  'EXAVITQu4vr4xnSDxMaL',
  'AI-powered voice agent for CR England recruitment and job applications',
  true,
  'gpt-4o-mini',
  'agent_1501k4dpkf2hfevs6eh5e7947a65'
FROM organizations 
WHERE slug = 'cr-england';