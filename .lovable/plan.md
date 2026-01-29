

# Add Three New ElevenLabs Voice AI Agents

## Overview

Add three new independent inbound voice agents to the platform. These agents will be configured as super-admin level agents without organization restrictions.

## Agents to Add

| Agent ID | Phone Number ID | Suggested Name |
|----------|-----------------|----------------|
| `agent_9701kg3s9dz1e0esh03ac4wv1pve` | `phnum_5501k910q8qzfnmbmznw6zqx3p8j` | Independent Inbound Agent 1 |
| `agent_9801kg5hpwm8ebps7hbnk615abxh` | `phnum_9201kg5txrvzerf89ccch3psp9qd` | Independent Inbound Agent 2 |
| `agent_7801kg3g60wjecwvdpv0jydx5fe1` | `phnum_01jzpapr78e87szxf7qjkbsmgv` | Independent Inbound Agent 3 |

## Important Notes

1. **Existing Phone Conflict**: Phone number `phnum_5501k910q8qzfnmbmznw6zqx3p8j` is currently assigned to "Inbound Agent - Hayes". The new agent will either:
   - Replace the existing agent's phone number, OR
   - Use a different phone number

2. **Organization Requirement**: The `voice_agents.organization_id` column is NOT NULL, meaning every agent must belong to an organization. For independent/super-admin agents, I'll need to either:
   - Make `organization_id` nullable (schema migration)
   - Use Hayes Recruiting Solutions as the "platform" organization (matches the pattern for the Global agent)

## Implementation Steps

### Step 1: Schema Migration (if org-independent)
Make `organization_id` nullable to support truly independent agents:

```sql
ALTER TABLE voice_agents ALTER COLUMN organization_id DROP NOT NULL;
```

### Step 2: Insert New Agents
Insert the three new voice agents:

```sql
-- Agent 1 (Note: Phone number currently used by Hayes agent - may need resolution)
INSERT INTO voice_agents (
  agent_name, agent_id, elevenlabs_agent_id, 
  agent_phone_number_id, is_active, is_outbound_enabled,
  llm_model, description
) VALUES (
  'Independent Inbound Agent 1',
  'agent_9701kg3s9dz1e0esh03ac4wv1pve',
  'agent_9701kg3s9dz1e0esh03ac4wv1pve',
  'phnum_5501k910q8qzfnmbmznw6zqx3p8j',
  true, false,
  'gpt-4o-mini',
  'Independent inbound voice agent managed by super admin'
);

-- Agent 2
INSERT INTO voice_agents (
  agent_name, agent_id, elevenlabs_agent_id,
  agent_phone_number_id, is_active, is_outbound_enabled,
  llm_model, description
) VALUES (
  'Independent Inbound Agent 2',
  'agent_9801kg5hpwm8ebps7hbnk615abxh',
  'agent_9801kg5hpwm8ebps7hbnk615abxh',
  'phnum_9201kg5txrvzerf89ccch3psp9qd',
  true, false,
  'gpt-4o-mini',
  'Independent inbound voice agent managed by super admin'
);

-- Agent 3
INSERT INTO voice_agents (
  agent_name, agent_id, elevenlabs_agent_id,
  agent_phone_number_id, is_active, is_outbound_enabled,
  llm_model, description
) VALUES (
  'Independent Inbound Agent 3',
  'agent_7801kg3g60wjecwvdpv0jydx5fe1',
  'agent_7801kg3g60wjecwvdpv0jydx5fe1',
  'phnum_01jzpapr78e87szxf7qjkbsmgv',
  true, false,
  'gpt-4o-mini',
  'Independent inbound voice agent managed by super admin'
);
```

## Technical Considerations

### RLS Policy Impact
The existing RLS policies allow public access to active voice agents:
```sql
CREATE POLICY "Public can view active voice agents"
ON voice_agents FOR SELECT USING (is_active = true);
```

This will work for the new agents since they'll be `is_active = true`.

### Edge Function Compatibility
The `elevenlabs-agent` edge function queries by `agent_id` and checks `is_active`. Null organization agents will work but may need verification in:
- `sync-voice-applications` - Currently filters by `is_active = true`
- `elevenlabs-conversations` - Queries by `elevenlabs_agent_id`

### Files Impacted
- Database schema migration (if making org_id nullable)
- No code changes required - existing functions handle null organization gracefully

## Questions to Confirm

1. Should I resolve the phone number conflict for `phnum_5501k910q8qzfnmbmznw6zqx3p8j` (currently used by Hayes agent)?
2. Do you have specific names for these three agents?
3. Should they be truly organization-independent (requires schema change) or associated with Hayes as a platform organization?

