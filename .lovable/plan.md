

## Assign Voice Agent to Aspenview Organization

### What needs to happen

**Agent ID**: `agent_7001kk37nfd8f5jv8zcpv5a96q8z`
**Aspenview Org**: `9335c64c-b793-4578-bf51-63d0c3b5d66d`
**Aspenview Client**: `82513316-7df2-4bf0-83d8-6c511c83ddfb`

### Step 1: Insert voice agent record

Insert a row into the `voice_agents` table linking this ElevenLabs agent to the Aspenview org/client:

- `agent_id` = `agent_7001kk37nfd8f5jv8zcpv5a96q8z` (used by edge function lookups)
- `elevenlabs_agent_id` = `agent_7001kk37nfd8f5jv8zcpv5a96q8z`
- `agent_name` = "Aspenview Cybersecurity Recruiter"
- `organization_id` = `9335c64c-b793-4578-bf51-63d0c3b5d66d`
- `client_id` = `82513316-7df2-4bf0-83d8-6c511c83ddfb`
- `is_active` = true
- `is_outbound_enabled` = false (inbound only initially)
- `is_platform_default` = false
- `llm_model` = `gpt-4o-mini`

### Step 2: Update voice application flow to use org-specific agents

Currently, `useElevenLabsVoice.tsx` hardcodes `useGlobalAgent: true` for all voice applications. This bypasses the `voice_agents` table entirely and uses the `GLOBAL_VOICE_AGENT_ID` env var.

**Change**: Modify `useElevenLabsVoice.tsx` to pass the ElevenLabs agent ID directly via the `directAgentId` parameter when the job belongs to an organization/client that has a dedicated agent. The flow becomes:

1. Accept an optional `agentId` field on `JobContext` (the job's org-specific agent)
2. If `agentId` is provided, connect via `directAgentId` (bypasses DB lookup, calls ElevenLabs API directly)
3. If no `agentId`, fall back to `useGlobalAgent: true` (current behavior)

### Step 3: Pass agent ID from job listings to voice flow

Update the public `JobDetailsPage` and `JobsPage` to query the `voice_agents` table for the job's `client_id`/`organization_id` and pass the matching `agent_id` into `startVoiceApplication()`. This can be done via a lightweight hook or inline query.

**Simpler alternative**: Since the `directAgentId` path in the edge function already works, we can look up the agent on the server side instead. We'd add a new mode to the `elevenlabs-agent` edge function: pass `organizationId`/`clientId` and let the function find the best matching agent (client-specific > org-specific > global fallback). This keeps the frontend simple and reuses the existing client-aware routing pattern from outbound calls.

### Recommended approach

**Option A (simpler, recommended)**: Add `organizationId`/`clientId` parameters to the `elevenlabs-agent` edge function. The function queries `voice_agents` for the best match, falling back to the global agent. Frontend passes job org/client context instead of hardcoding `useGlobalAgent`.

This aligns with the existing outbound call routing pattern and requires:
- Small update to `elevenlabs-agent/index.ts` — add org/client-aware agent lookup
- Update `useElevenLabsVoice.tsx` — pass `organizationId`/`clientId` from `JobContext` instead of `useGlobalAgent: true`
- Update `JobContext` type — add `organizationId` and `clientId` fields
- Update callers (`JobDetailsPage`, `JobsPage`, admin `JobsPage`) — pass org/client IDs from job data

### Summary of changes

| File | Change |
|------|--------|
| **Database** (insert) | Add voice agent record for Aspenview |
| `supabase/functions/elevenlabs-agent/index.ts` | Add org/client-aware agent resolution mode |
| `src/features/elevenlabs/hooks/useElevenLabsVoice.tsx` | Pass org/client context instead of `useGlobalAgent` |
| `src/features/elevenlabs/types/index.ts` | Add `organizationId`/`clientId` to `JobContext` |
| `src/pages/public/JobDetailsPage.tsx` | Pass `organization_id`/`client_id` from job data |
| `src/pages/public/JobsPage.tsx` | Pass `organization_id`/`client_id` from job data |
| `src/features/jobs/pages/JobsPage.tsx` | Pass `organization_id`/`client_id` from job data |

