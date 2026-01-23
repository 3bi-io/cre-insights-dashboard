
# Add Voice Agents for Day and Ross, Danny Herman, Hayes, and CR England

## Summary
Add 4 new inbound voice agents to the `voice_agents` table, each configured with their respective ElevenLabs agent IDs and phone number IDs.

## Agent Configuration Details

| Agent Name | Organization | Client | ElevenLabs Agent ID | Phone Number ID |
|------------|--------------|--------|---------------------|-----------------|
| Inbound - Day and Ross | Hayes Recruiting Solutions | Day and Ross | `agent_9601k9fejg06ep2rmefp4phjwnmj` | `phnum_7401k96e8sdrepsbdk5j370d01tc` |
| Inbound - Danny Herman | Hayes Recruiting Solutions | Danny Herman Trucking | `agent_0901k95ezb2kejwvc02pvycfj53v` | `phnum_7101k96egay9ed0bfc3tb3efftgt` |
| Inbound - Hayes | Hayes Recruiting Solutions | None (org-level) | `agent_3901k96k46dhecxbzhr85tmwrph7` | `phnum_5501k910q8qzfnmbmznw6zqx3p8j` |
| Inbound - CR England | CR England | None (org-level) | `agent_2601k9d75z14f508v87nx8mmwv78` | `phnum_01jz3x3nm8ex6rx09hmf3fr1ht` |

## Reference IDs

**Organizations:**
- Hayes Recruiting Solutions: `84214b48-7b51-45bc-ad7f-723bcf50466c`
- CR England: `682af95c-e95a-4e21-8753-ddef7f8c1749`

**Clients (under Hayes):**
- Day and Ross: `30ab5f68-258c-4e81-8217-1123c4536259`
- Danny Herman Trucking: `1d54e463-4d7f-4a05-8189-3e33d0586dea`

## Implementation

### Database Migration
Create a SQL migration to insert the 4 new voice agents:

```sql
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
```

## Verification Steps
After migration:
1. Query `voice_agents` table to confirm all 4 agents are inserted
2. Verify each agent shows in the Voice Agent management UI
3. Test agent connectivity using the ElevenLabs signed URL flow

## Technical Notes
- Both `agent_id` and `elevenlabs_agent_id` are set to the same value for consistency with existing patterns
- `is_outbound_enabled` defaults to `false` (these are inbound agents)
- `voice_id` defaults to Aria (`9BWtsMINqrJLrRacOk9x`)
- Client-specific agents (Day and Ross, Danny Herman) are linked via `client_id` for proper application routing
- Organization-level agents (Hayes, CR England) have `client_id = NULL`
