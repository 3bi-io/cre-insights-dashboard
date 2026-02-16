
# Update Founders Pass to Use Dedicated Agent ID

## What Changes

Restore the dedicated Founders Pass agent ID (`agent_2501khhvkybyfasbhrtp61s0xvcp`) but route it **directly to the ElevenLabs API**, bypassing the `voice_agents` database lookup that was causing the 404 error.

## Approach

The edge function currently has two paths:
1. **`useGlobalAgent: true`** -- uses `GLOBAL_VOICE_AGENT_ID` env var, skips DB lookup (works)
2. **`agentId` provided** -- looks up the ID in the `voice_agents` table (fails for this agent)

We will add a third option: `directAgentId` -- passes the ElevenLabs agent ID straight to the API without any database validation. This is clean and keeps the DB lookup intact for other use cases.

## Changes

### 1. Edge Function: `supabase/functions/elevenlabs-agent/index.ts`

Add a `directAgentId` parameter that skips the DB lookup:

```
const { agentId, useGlobalAgent, directAgentId } = await req.json();

if (directAgentId) {
  effectiveAgentId = directAgentId;
} else if (useGlobalAgent) {
  // existing global logic...
} else {
  // existing DB lookup logic...
}
```

### 2. Client Component: `src/features/landing/components/FoundersPassVoiceCTA.tsx`

- Restore the `FOUNDERS_PASS_AGENT_ID` constant
- Change `connect` call to pass the ID via the `directAgentId` context field instead of using `useGlobalAgent`

### 3. Hook: `src/features/elevenlabs/hooks/useVoiceAgentConnection.ts`

- Update `getSignedUrl` to forward a `directAgentId` field from context to the edge function body

This ensures the specific Founders Pass agent persona is used while avoiding the database lookup that was causing the error.
