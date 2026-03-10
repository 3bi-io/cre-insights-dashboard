-- Insert Aspenview Outbound Screener agent (without phone number - will be added later)
INSERT INTO voice_agents (
  agent_name,
  agent_id,
  elevenlabs_agent_id,
  organization_id,
  client_id,
  is_active,
  is_outbound_enabled,
  is_platform_default,
  llm_model,
  description
) VALUES (
  'Aspenview Outbound Screener',
  'agent_0901kkajxs22f42rfzhewmgh5jb8',
  'agent_0901kkajxs22f42rfzhewmgh5jb8',
  '9335c64c-b793-4578-bf51-63d0c3b5d66d',
  '82513316-7df2-4bf0-83d8-6c511c83ddfb',
  true,
  true,
  false,
  'gpt-4o-mini',
  'Outbound screening agent for Aspenview Technology Partners cybersecurity positions'
);

-- Insert organization_call_settings for Aspen Analytics (AST timezone)
INSERT INTO organization_call_settings (
  organization_id,
  client_id,
  business_hours_start,
  business_hours_end,
  business_hours_timezone,
  business_days,
  auto_follow_up_enabled,
  max_attempts,
  follow_up_delay_hours
) VALUES (
  '9335c64c-b793-4578-bf51-63d0c3b5d66d',
  NULL,
  '09:00:00',
  '17:00:00',
  'America/Puerto_Rico',
  '{1,2,3,4,5}',
  true,
  3,
  24
);