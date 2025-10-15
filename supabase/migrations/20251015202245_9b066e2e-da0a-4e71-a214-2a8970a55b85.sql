-- Add elevenlabs_agent_id column to voice_agents table
-- This column stores the ElevenLabs conversational AI agent ID

ALTER TABLE public.voice_agents
ADD COLUMN IF NOT EXISTS elevenlabs_agent_id text;

-- For existing records, copy agent_id to elevenlabs_agent_id if not null
UPDATE public.voice_agents
SET elevenlabs_agent_id = agent_id
WHERE elevenlabs_agent_id IS NULL AND agent_id IS NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_voice_agents_elevenlabs_agent_id 
ON public.voice_agents(elevenlabs_agent_id);