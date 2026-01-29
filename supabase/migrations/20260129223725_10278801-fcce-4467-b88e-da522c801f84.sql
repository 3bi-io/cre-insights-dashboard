-- Step 1: Make organization_id nullable for independent/super-admin agents
ALTER TABLE voice_agents ALTER COLUMN organization_id DROP NOT NULL;

-- Step 2: Clear the conflicting phone number from the existing Hayes agent
UPDATE voice_agents 
SET agent_phone_number_id = NULL 
WHERE agent_phone_number_id = 'phnum_5501k910q8qzfnmbmznw6zqx3p8j';

-- Step 3: Insert the three new independent inbound voice agents
INSERT INTO voice_agents (
  agent_name, agent_id, elevenlabs_agent_id, 
  agent_phone_number_id, is_active, is_outbound_enabled,
  llm_model, description
) VALUES 
  (
    'Independent Inbound Agent 1',
    'agent_9701kg3s9dz1e0esh03ac4wv1pve',
    'agent_9701kg3s9dz1e0esh03ac4wv1pve',
    'phnum_5501k910q8qzfnmbmznw6zqx3p8j',
    true, false,
    'gpt-4o-mini',
    'Independent inbound voice agent managed by super admin'
  ),
  (
    'Independent Inbound Agent 2',
    'agent_9801kg5hpwm8ebps7hbnk615abxh',
    'agent_9801kg5hpwm8ebps7hbnk615abxh',
    'phnum_9201kg5txrvzerf89ccch3psp9qd',
    true, false,
    'gpt-4o-mini',
    'Independent inbound voice agent managed by super admin'
  ),
  (
    'Independent Inbound Agent 3',
    'agent_7801kg3g60wjecwvdpv0jydx5fe1',
    'agent_7801kg3g60wjecwvdpv0jydx5fe1',
    'phnum_01jzpapr78e87szxf7qjkbsmgv',
    true, false,
    'gpt-4o-mini',
    'Independent inbound voice agent managed by super admin'
  );