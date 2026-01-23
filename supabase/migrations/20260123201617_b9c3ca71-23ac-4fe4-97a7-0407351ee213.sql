-- Enable existing Outbound Agent - Day & Ross
UPDATE public.voice_agents
SET is_outbound_enabled = true
WHERE agent_id = 'agent_2101k9wpz4n9fv78tkr5r5hs9c5c';

-- Insert Outbound Agent - Danny Herman
INSERT INTO public.voice_agents (
  organization_id,
  client_id,
  agent_name,
  agent_id,
  elevenlabs_agent_id,
  description,
  is_active,
  is_outbound_enabled,
  llm_model
) VALUES (
  '84214b48-7b51-45bc-ad7f-723bcf50466c',
  '1d54e463-4d7f-4a05-8189-3e33d0586dea',
  'Outbound Agent - Danny Herman',
  'agent_1501kfp6wq37e0vrcear1vebcbdg',
  'agent_1501kfp6wq37e0vrcear1vebcbdg',
  'Automated outbound calling agent for Danny Herman Trucking application follow-ups',
  true,
  true,
  'gpt-4o-mini'
);

-- Insert Outbound Agent - Pemberton (using correct client ID)
INSERT INTO public.voice_agents (
  organization_id,
  client_id,
  agent_name,
  agent_id,
  elevenlabs_agent_id,
  description,
  is_active,
  is_outbound_enabled,
  llm_model
) VALUES (
  '84214b48-7b51-45bc-ad7f-723bcf50466c',
  '67cadf11-8cce-41c6-8e19-7d2bb0be3b03',
  'Outbound Agent - Pemberton',
  'agent_0101kfp6waxpezy8r56ewhx8eqya',
  'agent_0101kfp6waxpezy8r56ewhx8eqya',
  'Automated outbound calling agent for Pemberton Truck Lines application follow-ups',
  true,
  true,
  'gpt-4o-mini'
);