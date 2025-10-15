-- Add voice_id column to voice_agents table to store ElevenLabs voice selection
ALTER TABLE public.voice_agents
ADD COLUMN IF NOT EXISTS voice_id text DEFAULT '9BWtsMINqrJLrRacOk9x';

-- Add comment for clarity
COMMENT ON COLUMN public.voice_agents.voice_id IS 'ElevenLabs voice ID for the agent (e.g., Aria, Roger, Sarah)';