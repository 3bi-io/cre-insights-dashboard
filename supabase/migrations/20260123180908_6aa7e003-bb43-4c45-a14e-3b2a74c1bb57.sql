-- Insert Inbound Agent for Day and Ross (client-specific)
INSERT INTO public.voice_agents (
  organization_id,
  client_id,
  agent_name,
  agent_id,
  elevenlabs_agent_id,
  agent_phone_number_id,
  description,
  is_active,
  llm_model
) VALUES (
  '84214b48-7b51-45bc-ad7f-723bcf50466c',
  '30ab5f68-258c-4e81-8217-1123c4536259',
  'Inbound Agent - Day and Ross',
  'agent_9601k9fejg06ep2rmefp4phjwnmj',
  'agent_9601k9fejg06ep2rmefp4phjwnmj',
  'phnum_7401k96e8sdrepsbdk5j370d01tc',
  'Inbound voice agent for Day and Ross applicants',
  true,
  'gpt-4o-mini'
);

-- Insert Inbound Agent for Danny Herman (client-specific)
INSERT INTO public.voice_agents (
  organization_id,
  client_id,
  agent_name,
  agent_id,
  elevenlabs_agent_id,
  agent_phone_number_id,
  description,
  is_active,
  llm_model
) VALUES (
  '84214b48-7b51-45bc-ad7f-723bcf50466c',
  '1d54e463-4d7f-4a05-8189-3e33d0586dea',
  'Inbound Agent - Danny Herman',
  'agent_0901k95ezb2kejwvc02pvycfj53v',
  'agent_0901k95ezb2kejwvc02pvycfj53v',
  'phnum_7101k96egay9ed0bfc3tb3efftgt',
  'Inbound voice agent for Danny Herman Trucking applicants',
  true,
  'gpt-4o-mini'
);

-- Insert Inbound Agent for Hayes (organization-level)
INSERT INTO public.voice_agents (
  organization_id,
  client_id,
  agent_name,
  agent_id,
  elevenlabs_agent_id,
  agent_phone_number_id,
  description,
  is_active,
  llm_model
) VALUES (
  '84214b48-7b51-45bc-ad7f-723bcf50466c',
  NULL,
  'Inbound Agent - Hayes',
  'agent_3901k96k46dhecxbzhr85tmwrph7',
  'agent_3901k96k46dhecxbzhr85tmwrph7',
  'phnum_5501k910q8qzfnmbmznw6zqx3p8j',
  'Inbound voice agent for Hayes Recruiting Solutions',
  true,
  'gpt-4o-mini'
);

-- Insert Inbound Agent for CR England (organization-level)
INSERT INTO public.voice_agents (
  organization_id,
  client_id,
  agent_name,
  agent_id,
  elevenlabs_agent_id,
  agent_phone_number_id,
  description,
  is_active,
  llm_model
) VALUES (
  '682af95c-e95a-4e21-8753-ddef7f8c1749',
  NULL,
  'Inbound Agent - CR England',
  'agent_2601k9d75z14f508v87nx8mmwv78',
  'agent_2601k9d75z14f508v87nx8mmwv78',
  'phnum_01jz3x3nm8ex6rx09hmf3fr1ht',
  'Inbound voice agent for CR England applicants',
  true,
  'gpt-4o-mini'
);