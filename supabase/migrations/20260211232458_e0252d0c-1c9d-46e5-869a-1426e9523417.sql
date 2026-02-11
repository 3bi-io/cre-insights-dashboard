-- Fix Danny Herman outbound flag
UPDATE public.voice_agents 
SET is_outbound_enabled = true 
WHERE id = '0d300a8f-f7b8-4108-9af1-0e20befb321b';

-- Assign Independent Inbound Agents to Hayes Recruiting Solutions
UPDATE public.voice_agents 
SET organization_id = '84214b48-7b51-45bc-ad7f-723bcf50466c' 
WHERE id IN (
  '4c776662-3bd9-4af1-9374-e2d241b62bf2',
  '62f01aa5-08c4-4596-b912-e035ffdd7f45',
  '6b27c708-00fb-43c9-a747-afa7bcd684f7'
);