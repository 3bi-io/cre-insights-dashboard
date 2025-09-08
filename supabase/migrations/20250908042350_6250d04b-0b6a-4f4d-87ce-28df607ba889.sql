-- Update the voice agent record to set created_by properly
UPDATE public.voice_agents 
SET created_by = (SELECT id FROM auth.users WHERE email = 'c@3bi.io' LIMIT 1)
WHERE agent_id = 'cr_england_voice_agent_001' AND created_by IS NULL;