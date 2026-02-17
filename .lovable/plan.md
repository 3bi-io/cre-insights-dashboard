

# Add James Burg Inbound Voice Agent

## What

Insert a new inbound voice agent for James Burg Trucking into the `voice_agents` table via SQL migration.

## SQL Migration

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

## Details

- **Organization:** Hayes Recruiting (`84214b48-7b51-45bc-ad7f-723bcf50466c`)
- **Client:** James Burg Trucking (`b2a29507-32a6-4f5e-85d6-a7e6ffac3c52`)
- **Agent ID:** `agent_2101kgttq4rsef5sx07bbzgbt8my` (both `agent_id` and `elevenlabs_agent_id`)
- **Inbound only:** `is_outbound_enabled = false`
- **Active:** `is_active = true`

No code changes needed. The existing `hayes-jamesburg-inbound` edge function and client-aware routing logic will automatically use this agent for James Burg job listings.

