

## Review: ElevenLabs Overrides — Current Issues and Best-in-Class Fix

### The Problem

Now that you've enabled all overrides in the ElevenLabs dashboard, the current code has a critical conflict:

**`createAgentOverrides()` replaces your entire dashboard-configured system prompt** with a minimal 4-line template every time a session starts:

```
"You are assisting a candidate to apply for {jobTitle} at {company}..."
```

This overwrites any carefully tuned instructions you've set in the dashboard (scheduling behavior, data collection rules, tone guidelines, tool usage instructions). The override is sent on every connection because `createAgentOverrides` is called whenever a `jobContext` exists — which is always.

### What Should Change

The architecture should shift to: **Dashboard owns the system prompt; code injects context via dynamic variables and targeted overrides only.**

#### 1. Remove prompt override, keep firstMessage override only

The `createAgentOverrides` function currently sends `agent.prompt.prompt` which fully replaces the dashboard prompt. This should be removed. The `firstMessage` override is valuable — it personalizes the greeting per-job.

**File: `src/features/elevenlabs/utils/agentConfig.ts`**

- Remove `createJobContextPrompt` (no longer needed — dashboard manages the prompt)
- Keep `createFirstMessage` for personalized greetings
- Update `createAgentOverrides` to only send `firstMessage` (not `prompt`)

#### 2. Expand the AgentOverrides type to support TTS overrides

Since all overrides are now enabled, the type should support optional `tts` overrides (voice selection per-agent/per-job):

**File: `src/features/elevenlabs/types/index.ts`**

Update `AgentOverrides` to:
- Make `prompt` optional (only send when explicitly needed)
- Add optional `tts` block for `voiceId`
- Make `language` configurable rather than hardcoded to `'en'`

#### 3. Enrich dynamic variables

Dynamic variables are the correct mechanism for injecting job context into dashboard-managed prompts. The dashboard prompt references `{{job_title}}`, `{{company_name}}`, etc. Currently we pass 10 variables. We should also pass:
- `job_benefits` sourced from the centralized benefits catalog (already partially wired in `useElevenLabsVoice.tsx`)
- Ensure the benefits hook data actually flows through to the dynamic variables

#### 4. Update connection logic

**File: `src/features/elevenlabs/hooks/useVoiceAgentConnection.ts`**

- Only spread `overrides` when there are meaningful overrides to send (not an empty prompt override)
- The `firstMessage` override should still be sent to personalize greetings

### Summary of Changes

| File | Change |
|------|--------|
| `src/features/elevenlabs/utils/agentConfig.ts` | Remove prompt override; keep firstMessage only |
| `src/features/elevenlabs/types/index.ts` | Make `AgentOverrides.agent.prompt` optional; add `tts` block |
| `src/features/elevenlabs/hooks/useVoiceAgentConnection.ts` | No functional change (already conditionally spreads overrides) |

This is a small, focused change: stop overwriting the dashboard prompt, keep personalizing the greeting, and let the dashboard-configured instructions (including scheduling tools, data collection, and tone) work as designed.

