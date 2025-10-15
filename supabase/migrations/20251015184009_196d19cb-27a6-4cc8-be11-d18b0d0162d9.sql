-- Add llm_model column to voice_agents table
ALTER TABLE public.voice_agents
ADD COLUMN llm_model text DEFAULT 'gpt-4o-mini';

-- Add index for better query performance
CREATE INDEX idx_voice_agents_llm_model ON public.voice_agents(llm_model);