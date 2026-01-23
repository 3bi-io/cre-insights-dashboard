
# Add Outbound Voice Agents for Danny Herman, Pemberton, and Day & Ross

## Summary
Add 2 new outbound voice agents and update 1 existing agent to enable outbound calling functionality for Danny Herman, Pemberton, and Day & Ross clients under Hayes Recruiting Solutions.

## Current State Analysis

### Existing Voice Agents
| Agent Name | Type | Client | Agent ID | Outbound Enabled |
|------------|------|--------|----------|------------------|
| Inbound Agent - Day & Ross | Inbound | Day and Ross | `agent_9601k9...` | No |
| Inbound Agent - Danny Herman | Inbound | Danny Herman Trucking | `agent_0901k9...` | No |
| **Outbound Agent - Day & Ross** | Outbound | Day and Ross | `agent_2101k9...` | **No (needs fix)** |

### Client ID Clarification
**Important**: The user provided `1d54e463-4d7f-4a05-8189-3e33d0586dea` for Pemberton, but this is actually the Danny Herman Trucking client ID. The correct IDs are:

| Client | Correct Client ID | Job Listings |
|--------|-------------------|--------------|
| Danny Herman Trucking | `1d54e463-4d7f-4a05-8189-3e33d0586dea` | 127 |
| Day and Ross | `30ab5f68-258c-4e81-8217-1123c4536259` | 46 |
| Pemberton Truck Lines Inc | `67cadf11-8cce-41c6-8e19-7d2bb0be3b03` | 81 |

## Implementation Plan

### Step 1: Enable Existing Outbound Agent - Day & Ross
The agent already exists with the correct agent ID (`agent_2101k9wpz4n9fv78tkr5r5hs9c5c`), just needs `is_outbound_enabled` set to true:

```sql
UPDATE public.voice_agents
SET is_outbound_enabled = true
WHERE agent_id = 'agent_2101k9wpz4n9fv78tkr5r5hs9c5c';
```

### Step 2: Add Outbound Agent - Danny Herman
```sql
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
```

### Step 3: Add Outbound Agent - Pemberton
Using the **correct** Pemberton client ID (`67cadf11-8cce-41c6-8e19-7d2bb0be3b03`):

```sql
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
```

## Technical Considerations

### Trigger Logic Enhancement Needed
The current outbound call trigger (`trigger_application_insert_outbound_call`) only matches voice agents by `organization_id`, not `client_id`. This means:
- All new applications under Hayes Recruiting will use whichever outbound agent is found first
- Client-specific routing (Danny Herman apps -> Danny Herman agent) won't work automatically

**Recommended Fix**: Update the trigger to prefer client-specific agents when available:
```sql
-- Look for client-specific agent first, then fall back to org-level
SELECT id INTO v_voice_agent_id
FROM voice_agents
WHERE organization_id = v_org_id
  AND is_outbound_enabled = true
  AND agent_phone_number_id IS NOT NULL
  AND is_active = true
  AND (client_id = v_client_id OR client_id IS NULL)
ORDER BY client_id NULLS LAST
LIMIT 1;
```

### Job Listings Verification
After implementation, verify agents are correctly associated:
- Danny Herman: 127 active job listings
- Day and Ross: 46 active job listings  
- Pemberton: 81 active job listings

All job listings are under Hayes Recruiting Solutions (`84214b48-7b51-45bc-ad7f-723bcf50466c`) with their respective `client_id` values.

## Post-Implementation Verification
1. Query `voice_agents` to confirm all 3 outbound agents exist with `is_outbound_enabled = true`
2. Verify correct `client_id` associations for each agent
3. Test by creating a sample application to verify correct agent routing
