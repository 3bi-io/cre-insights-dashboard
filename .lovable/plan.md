

# Review: ElevenLabs Voice Agent Scheduling Functions

## Functions Reviewed

| Function | Lines | Purpose |
|----------|-------|---------|
| `agent-scheduling` | 583 | Webhook tool for check_availability, book_callback, get_next_slots |
| `elevenlabs-outbound-call` | 1954 | Queue processing, sync stuck calls, single outbound calls, after-hours callbacks |
| `elevenlabs-conversation-webhook` | 647 | Real-time webhook from ElevenLabs when conversations end |

---

## Issues Found

### 1. CRITICAL — `elevenlabs-outbound-call` Has Unused Import

Line 10 imports `createClient` from `https://esm.sh/@supabase/supabase-js@2.57.2` but it is **never called**. The function uses `getServiceClient()` (from `_shared/supabase-client.ts` which pins `@2.50.0`). This is dead code and a version mismatch risk — if `createClient` were ever used accidentally, it would pull in a different SDK version than the rest of the platform.

**Fix**: Remove the `createClient` import on line 10.

### 2. MODERATE — `elevenlabs-conversation-webhook` Uses Inline CORS

Lines 30-34 hardcode `corsHeaders` with `'Access-Control-Allow-Origin': '*'` instead of using the platform-standard `getCorsHeaders()` with origin validation. This is the same pattern that was just fixed in `ats-integration` and `ats-retry`.

**Fix**: Import `getCorsHeaders` and `handleCorsPreflightIfNeeded` from `_shared/cors-config.ts` and replace inline headers.

### 3. MODERATE — `elevenlabs-conversation-webhook` Type Annotation Uses Unavailable `createClient`

Line 79 types the `supabase` parameter as `ReturnType<typeof createClient>` but `createClient` is **not imported** in this file. This works at runtime because TypeScript inference covers it, but it's semantically incorrect and could break if strict type checking is applied. The function actually uses `getServiceClient()`.

**Fix**: Change the parameter type to `ReturnType<typeof getServiceClient>` or use `SupabaseClient` from the SDK.

### 4. MODERATE — Duplicated SMS Verification Logic (3 Locations)

The SMS verification/follow-up logic (enrichment check, voicemail SMS message construction, `sms_verification_sessions` insert) is duplicated nearly identically in:
- `elevenlabs-outbound-call/index.ts` lines 534-661 (sync_initiated path)
- `elevenlabs-conversation-webhook/index.ts` lines 282-377 (webhook voicemail path)

Both locations build the same verification message template, perform identical enrichment checks, and insert into the same tables. Any future change to the SMS template or logic must be updated in both places.

**Fix**: Extract into a shared utility function in `_shared/sms-verification.ts` (e.g., `sendVoicemailVerificationSms(supabase, outboundCallId, applicationId)`) and call from both locations.

### 5. MODERATE — Duplicated Voicemail Detection Logic (2 Locations)

Voicemail detection (tool call check + transcript keyword fallback with the same `vmPhrases` array) is duplicated between:
- `elevenlabs-outbound-call/index.ts` lines 268-287 (sync path)
- `elevenlabs-conversation-webhook/index.ts` lines 237-251 (webhook path)

**Fix**: Extract `detectVoicemail(toolCalls, transcript)` into `_shared/voicemail-detection.ts`.

### 6. LOW — `agent-scheduling` Hardcodes `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

Lines 18-19 read env vars directly instead of using `getServiceClient()` for the Supabase client (which it does on line 117), but the raw URL/key are used for `fetchWithTimeout` calls to `calendar-integration`. This is fine functionally but breaks the encapsulation pattern — if `getServiceClient()` ever changes how it resolves these values, the scheduling function won't track.

**Fix**: Low priority. Could use `Deno.env.get()` calls inline where needed (already done) but worth noting for consistency.

### 7. LOW — `agent-scheduling` `handleGetNextSlots` is a Pass-Through

Lines 574-583: `handleGetNextSlots` simply delegates to `handleCheckAvailability` with the same params. This is fine as a semantic alias for the ElevenLabs tool interface, but could confuse future maintainers.

**Fix**: Add a comment explaining this is an intentional alias for the ElevenLabs tool configuration.

### 8. LOW — `agent-scheduling` Daily Cap Check Uses UTC Boundaries

Lines 478-481 in `handleBookCallback`: `dayStart.setHours(0,0,0,0)` and `dayEnd.setHours(23,59,59,999)` operate in UTC, not in the recruiter's timezone. A booking at 11 PM EST would count toward the UTC "next day" cap. The `handleCheckAvailability` function correctly handles timezone conversion (lines 354-357) but `handleBookCallback` doesn't.

**Fix**: Apply the same `localToUtc` timezone conversion to the daily cap query in `handleBookCallback`.

### 9. INFO — `elevenlabs-outbound-call` File Size

At 1,954 lines, this function handles queue processing, sync reconciliation, single calls, after-hours scheduling, dynamic variable building, SMS follow-ups, and job inference. While functionally correct, it's the largest edge function in the platform. Long-term, consider extracting:
- `buildDynamicVariables` + inference helpers → `_shared/dynamic-variables.ts`
- SMS verification logic → `_shared/sms-verification.ts`
- Voicemail detection → `_shared/voicemail-detection.ts`

This would reduce the file to ~800 lines and improve testability.

---

## Recommended Changes (Priority Order)

| # | File | Change | Priority |
|---|------|--------|----------|
| 1 | `elevenlabs-outbound-call/index.ts` | Remove unused `createClient` import (line 10) | Critical |
| 2 | `elevenlabs-conversation-webhook/index.ts` | Replace inline CORS with `getCorsHeaders()` | Moderate |
| 3 | `elevenlabs-conversation-webhook/index.ts` | Fix `ReturnType<typeof createClient>` type annotation | Moderate |
| 4 | New: `_shared/sms-verification.ts` | Extract shared SMS verification logic | Moderate |
| 5 | New: `_shared/voicemail-detection.ts` | Extract shared voicemail detection logic | Moderate |
| 6 | `agent-scheduling/index.ts` | Fix timezone in `handleBookCallback` daily cap query | Low |
| 7 | `agent-scheduling/index.ts` | Add comment to `handleGetNextSlots` alias | Low |

### Files Changed: 4 edited + 2 new shared utilities

Items 1-3 are quick fixes. Items 4-5 are refactors that reduce duplication and risk of drift. Item 6 is a correctness fix for an edge case (bookings near midnight in non-UTC timezones).

