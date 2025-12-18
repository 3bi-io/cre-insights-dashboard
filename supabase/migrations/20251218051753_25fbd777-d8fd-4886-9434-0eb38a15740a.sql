-- Insert Hayes Recruiting Solutions voice agents
-- Organization ID: 84214b48-7b51-45bc-ad7f-723bcf50466c

-- Outbound Agent for automatic follow-up calls
INSERT INTO voice_agents (
  organization_id,
  agent_name,
  agent_id,
  elevenlabs_agent_id,
  agent_phone_number_id,
  is_outbound_enabled,
  is_active,
  description
) VALUES (
  '84214b48-7b51-45bc-ad7f-723bcf50466c',
  'Hayes Outbound Agent',
  'agent_2101k9wpz4n9fv78tkr5r5hs9c5c',
  'agent_2101k9wpz4n9fv78tkr5r5hs9c5c',
  '+12148884394',
  true,
  true,
  'Automated outbound calling agent for new application follow-ups'
);

-- Inbound Agent for applicant inquiries
INSERT INTO voice_agents (
  organization_id,
  agent_name,
  agent_id,
  elevenlabs_agent_id,
  agent_phone_number_id,
  is_outbound_enabled,
  is_active,
  description
) VALUES (
  '84214b48-7b51-45bc-ad7f-723bcf50466c',
  'Hayes Inbound Agent',
  'agent_3901k96k46dhecxbzhr85tmwrph7',
  'agent_3901k96k46dhecxbzhr85tmwrph7',
  '+12565002580',
  false,
  true,
  'Inbound voice agent for applicant inquiries'
);