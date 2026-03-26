

## ElevenLabs Production Audit & Refactoring Plan

### Audit Summary

After reviewing all 7 ElevenLabs edge functions, the client-side hooks, and the shared utilities, the infrastructure is in strong shape for production. Here is what I found and what needs cleanup:

### What is working correctly

- **No esm.sh imports** across any ElevenLabs function -- all use `npm:` specifiers or `deno.land/std`
- **No client-side firstMessage/voiceId overrides** in `useVoiceAgentConnection` -- prompts are dashboard-managed
- **Dynamic variables** are injected correctly for both web (client-side) and outbound (server-side) channels
- **Per-agent delay** (`first_message_delay_ms`) is tunable via `voice_agents.metadata`, defaulting to 2000ms
- **Transcript auto-fetch** on terminal call status is implemented in `elevenlabs-call-status`
- **Voicemail detection** (tool call + transcript keyword fallback) triggers SMS follow-up in the conversation webhook
- **Organization isolation** is enforced in `elevenlabs-agent` (org validation, rate limiting)
- **Conversation upsert** with `onConflict: "conversation_id"` prevents duplicates
- **Retry logic** with transient/permanent error distinction in outbound call function
- **CORS** uses `getCorsHeaders(origin)` consistently across all functions (except `elevenlabs-conversation-webhook` which uses a static `*` -- acceptable for an external webhook endpoint)

### Issues found -- refactoring needed

1. **Dead code: `agentConfig.ts`**
   - `createFirstMessage()` and `createAgentOverrides()` are exported and documented in the README but **never imported** by any live code path. They generate `firstMessage` and `voiceId` overrides -- the exact pattern we removed to fix glitches.
   - **Action**: Remove these two functions and their type (`AgentOverrides`) from `agentConfig.ts`. Keep `normalizeAgentId` and `validateAgentId`. Update barrel exports and README.

2. **Dead type: `AgentOverrides` in `types/index.ts`**
   - The `AgentOverrides` interface supports the removed override pattern. No live code references it.
   - **Action**: Remove the `AgentOverrides` interface from the types barrel.

3. **README is stale**
   - `src/features/elevenlabs/README.md` documents `createAgentOverrides` usage patterns that no longer apply.
   - **Action**: Update README to reflect current architecture (dynamic variables only, no overrides).

4. **`elevenlabs-conversation-webhook` uses `serve()` from deno.land instead of `Deno.serve()`**
   - All newer functions use `Deno.serve()`. The webhook still uses `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"`. This works but is inconsistent.
   - Same applies to `elevenlabs-outbound-call`, `elevenlabs-call-status`, `elevenlabs-conversations`, and `elevenlabs-api`.
   - **Action**: Migrate these 5 functions from `serve()` to `Deno.serve()` to match the pattern in `elevenlabs-agent`. This is a low-risk, one-line change per file that removes an unnecessary import.

5. **`elevenlabs-conversations` has an unused `createClient` import**
   - Line 2: `import { createClient } from "npm:@supabase/supabase-js@2.50.0"` is imported at the top level but only used inside a conditional block (for auth). It should use a dynamic import like `elevenlabs-agent` does, or keep it but it's harmless.
   - **Action**: No change needed -- the static import is fine and avoids dynamic import overhead.

6. **`elevenlabs-outbound-call` is 1864 lines**
   - The file contains the main handler, queue processing, single call execution, `buildDynamicVariables`, and 15+ inference helper functions.
   - **Action**: No split needed for this cycle. The function deploys and executes correctly. A future refactor could extract `buildDynamicVariables` and inference helpers into `_shared/`, but that risks deployment issues for no immediate benefit.

### Files to change

| File | Change |
|------|--------|
| `src/features/elevenlabs/utils/agentConfig.ts` | Remove `createFirstMessage`, `createAgentOverrides`. Keep `normalizeAgentId`, `validateAgentId`. |
| `src/features/elevenlabs/types/index.ts` | Remove `AgentOverrides` interface |
| `src/features/elevenlabs/index.ts` | Remove `AgentOverrides` from exports if explicitly listed |
| `src/features/elevenlabs/README.md` | Update to reflect current dynamic-variables-only architecture |
| `supabase/functions/elevenlabs-api/index.ts` | Replace `serve()` import with `Deno.serve()` |
| `supabase/functions/elevenlabs-call-status/index.ts` | Replace `serve()` import with `Deno.serve()` |
| `supabase/functions/elevenlabs-conversations/index.ts` | Replace `serve()` import with `Deno.serve()` |
| `supabase/functions/elevenlabs-conversation-webhook/index.ts` | Replace `serve()` import with `Deno.serve()` |
| `supabase/functions/elevenlabs-outbound-call/index.ts` | Replace `serve()` import with `Deno.serve()` |

### What does NOT need changing

- `useVoiceAgentConnection.ts` -- clean, no overrides, proper retry/timeout logic
- `useElevenLabsVoice.tsx` -- uses `connect()` without overrides correctly
- `buildDynamicVariables()` -- already trimmed in previous iteration
- `elevenlabs-agent/index.ts` -- already uses `Deno.serve()`, proper org isolation
- Transcript enrichment utility -- correct multi-layer sync strategy
- Twilio client -- centralized, E.164 normalization

### Technical details

The `serve()` to `Deno.serve()` migration is a simple pattern swap:

```text
// Before
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
serve(async (req) => { ... });

// After  
Deno.serve(async (req) => { ... });
```

This removes an external dependency, slightly improves boot time, and aligns with the pattern already used in `elevenlabs-agent`.

