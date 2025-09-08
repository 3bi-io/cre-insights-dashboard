-- Insert voice agent for CR England organization
INSERT INTO public.voice_agents (
  organization_id,
  agent_name,
  agent_id,
  description,
  is_active
) VALUES (
  '682af95c-e95a-4e21-8753-ddef7f8c1749',
  'CR England Recruitment Agent',
  'cr_england_voice_agent_001',
  'AI voice agent for CR England recruitment and driver onboarding',
  true
);