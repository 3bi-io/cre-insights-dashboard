

# Add James Burg Inbound Voice Agent

## What

Insert a new inbound voice agent row for James Burg Trucking, matching the pattern of existing client-specific inbound agents (Danny Herman, Pemberton, Day and Ross).

## Details

```sql
INSERT INTO voice_agents (
  organization_id,
  client_id,
  agent_name,
  agent_id,
  elevenlabs_agent_id,
  is_active,
  is_outbound_enabled,
  is_platform_default,
  llm_model
) VALUES (
  '84214b48-7b51-45bc-ad7f-723bcf50466c',
  'b2a29507-32a6-4f5e-85d6-a7e6ffac3c52',
  'Inbound Agent - James Burg',
  'agent_2101kgttq4rsef5sx07bbzgbt8my',
  'agent_2101kgttq4rsef5sx07bbzgbt8my',
  true,
  false,
  false,
  'gpt-4o-mini'
);
```

- Organization: Hayes Recruiting (`84214b48...`)
- Client: James Burg Trucking (`b2a29507...`)
- Both `agent_id` and `elevenlabs_agent_id` set to the provided ID
- `is_outbound_enabled = false` (inbound only)
- `is_active = true`

No code changes needed -- the existing client-aware routing logic in the inbound endpoints will automatically pick up this agent for James Burg job listings.
