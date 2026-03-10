

## ElevenLabs Full Review — Refactoring Plan

### Current State

The ElevenLabs integration spans **9 frontend hooks**, **5 components**, **3 utility modules**, **7 edge functions**, and **4 backward-compatibility shim files**. The architecture is mature and well-structured under `src/features/elevenlabs/`, but the review surfaces several concrete issues.

### Issues Found

#### 1. `elevenlabs-conversations` edge function uses hardcoded CORS (inconsistent)

**File:** `supabase/functions/elevenlabs-conversations/index.ts`

Uses inline `corsHeaders` object (line 7-10) instead of the standardized `getCorsHeaders()` from `_shared/cors-config.ts`. Every other ElevenLabs edge function uses the shared utility. This means origin-aware CORS is not applied to conversation sync, transcript fetch, and audio download actions.

**Fix:** Replace hardcoded `corsHeaders` with `getCorsHeaders(origin)` and use `successResponse`/`errorResponse` utilities for consistent response formatting.

#### 2. `elevenlabs-conversations` duplicates Conversation/Transcript/Audio types

**File:** `supabase/functions/elevenlabs-conversations/index.ts` (lines 12-49)

Defines local `Conversation`, `Transcript`, `Audio` interfaces that duplicate the types already defined in `src/features/elevenlabs/types/index.ts`. While edge functions can't import from `src/`, the local types are only used for casting and don't need to be maintained separately — they're never validated. The hook `useElevenLabsConversations.tsx` also re-declares these same three interfaces locally (lines 12-49) instead of importing from `@/features/elevenlabs/types`.

**Fix:** Update `useElevenLabsConversations.tsx` to import `Conversation`, `Transcript`, `Audio` from `@/features/elevenlabs/types` instead of re-declaring them. Leave the edge function's local types as-is (edge functions can't import from `src/`).

#### 3. Backward-compatibility shim files still consumed by active code

Seven components still import from deprecated `src/hooks/` shims:

| Shim file | Active consumers |
|-----------|-----------------|
| `src/hooks/useElevenLabsVoice.tsx` | `VoiceApplicationContainer.tsx`, `features/jobs/hooks/index.ts` |
| `src/hooks/useElevenLabsAPI.tsx` | `ElevenLabsUsageAnalytics.tsx`, `VoiceLibrary.tsx`, `TextToSpeechPanel.tsx` |
| `src/hooks/useElevenLabsConversations.tsx` | `ConversationDetailsDialog.tsx`, `ElevenLabsAdmin.tsx` |
| `src/hooks/useVoiceAgents.tsx` | `HistoryImportButton.tsx`, `OrganizationAgentAssignment.tsx`, `ElevenLabsAdmin.tsx` |
| `src/hooks/useOutboundCalls.tsx` | `OutboundCallHistory.tsx` |

**Fix:** Update all 10 consumer files to import directly from `@/features/elevenlabs/hooks` (or `@/features/elevenlabs`), then delete the 5 shim files.

#### 4. `useElevenLabsConversations` batched transcript count is N+1 wasteful

**File:** `src/features/elevenlabs/hooks/useElevenLabsConversations.tsx` (lines 88-118)

Fetches ALL transcript rows just to count them per conversation. For large conversation histories this pulls thousands of rows. Should use a Postgres `count` function or a view instead.

**Fix:** Create a database function `get_conversation_message_counts(conversation_ids uuid[])` that returns `{conversation_id, count}` and call it in a single RPC instead of fetching all transcript rows.

#### 5. `elevenlabs-call-status` uses hardcoded CORS

**File:** `supabase/functions/elevenlabs-call-status/index.ts` (lines 8-10)

Same issue as #1 — uses inline CORS headers instead of `getCorsHeaders()`.

**Fix:** Import and use `getCorsHeaders(origin)`.

#### 6. `VoiceAgent` type has redundant `agent_id` and `elevenlabs_agent_id` fields

**File:** `src/features/elevenlabs/types/index.ts` (lines 8-24)

The `VoiceAgent` interface declares both `agent_id` and `elevenlabs_agent_id` which map to the same underlying ElevenLabs agent identifier. This traces to a migration that added `elevenlabs_agent_id` as a renamed copy. Some edge functions use `agent_id`, others use `elevenlabs_agent_id`, creating confusion.

**Recommendation:** This is a schema-level issue. Defer to a separate migration that drops the duplicate column. No code change in this refactor — just document the discrepancy.

#### 7. `AgentOverrides` type has `language` hardcoded to `'en'` literal

**File:** `src/features/elevenlabs/types/index.ts` (line 145)

The `language` field is typed as `'en'` (string literal) rather than `string`, preventing multi-language support.

**Fix:** Change `language: 'en'` to `language?: string` to support any language code.

### Implementation Plan

#### Step 1: Migrate deprecated imports (10 consumer files)

Update imports in these files from `@/hooks/useElevenLabs*` / `@/hooks/useVoiceAgents` / `@/hooks/useOutboundCalls` to `@/features/elevenlabs/hooks` or `@/features/elevenlabs`:

- `src/components/voice/ElevenLabsUsageAnalytics.tsx`
- `src/components/voice/ConversationDetailsDialog.tsx`
- `src/components/voice/VoiceLibrary.tsx`
- `src/components/voice/TextToSpeechPanel.tsx`
- `src/components/voice/OutboundCallHistory.tsx`
- `src/components/voice/OrganizationAgentAssignment.tsx`
- `src/components/applications/HistoryImportButton.tsx`
- `src/components/shared/VoiceApplicationContainer.tsx`
- `src/features/jobs/hooks/index.ts`
- `src/pages/ElevenLabsAdmin.tsx`

Then delete the 5 shim files:
- `src/hooks/useElevenLabsVoice.tsx`
- `src/hooks/useElevenLabsAPI.tsx`
- `src/hooks/useElevenLabsConversations.tsx`
- `src/hooks/useVoiceAgents.tsx`
- `src/hooks/useOutboundCalls.tsx`

#### Step 2: Deduplicate types in useElevenLabsConversations

Remove local `Conversation`, `Transcript`, `Audio` interfaces from `useElevenLabsConversations.tsx` and import from `@/features/elevenlabs/types`.

#### Step 3: Standardize CORS in edge functions

Update `elevenlabs-conversations/index.ts` and `elevenlabs-call-status/index.ts` to use `getCorsHeaders(origin)` from `_shared/cors-config.ts` instead of hardcoded CORS headers.

#### Step 4: Fix `AgentOverrides.language` type

Change from `language: 'en'` to `language?: string` in `src/features/elevenlabs/types/index.ts`.

#### Step 5: Optimize transcript count query

Create a database function for conversation message counts and update `useElevenLabsConversations` to use it instead of fetching all transcript rows.

### Summary

| Change | Files affected | Risk |
|--------|---------------|------|
| Migrate deprecated imports | 10 consumer + 5 deleted shims | Low — pure re-export, same APIs |
| Deduplicate conversation types | 1 hook | Low |
| Standardize CORS (2 edge fns) | 2 edge functions | Low |
| Fix language type | 1 type file | Low |
| Optimize transcript counts | 1 hook + 1 migration | Medium — new DB function |

