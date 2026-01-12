-- Add client_id column to voice_agents table to link agents to specific clients
ALTER TABLE public.voice_agents 
ADD COLUMN client_id UUID REFERENCES public.clients(id);

-- Create index for faster lookups
CREATE INDEX idx_voice_agents_client_id ON public.voice_agents(client_id);

-- Update Hayes Inbound Agent to link to Pemberton Truck Lines Inc
UPDATE public.voice_agents 
SET client_id = '67cadf11-8cce-41c6-8e19-7d2bb0be3b03'
WHERE elevenlabs_agent_id = 'agent_9201kegcfrw8fctvawnqa8v80wx0'
  AND organization_id = '84214b48-7b51-45bc-ad7f-723bcf50466c';

-- Add comment for documentation
COMMENT ON COLUMN public.voice_agents.client_id IS 'Links voice agent to a specific client within the organization for application routing';