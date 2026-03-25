

## Plan: SMS Follow-Up on Any Voicemail Detection

### Problem
Currently, only calls under 15 seconds are treated as voicemail. Longer voicemails (e.g., Jerry Hayes's 51-second call where the AI talked to a voicemail box) are marked `completed` and never trigger SMS follow-up.

### Solution: Two-Pronged Voicemail Detection

**Approach A — ElevenLabs Built-In Voicemail Detection (Primary)**

ElevenLabs recently shipped a native voicemail detection system tool. When enabled on the agent, the LLM analyzes conversation patterns in real-time (automated greetings, "leave a message after the beep", lack of interactive responses) and fires a `voicemail_detection` function call. This is the most reliable method regardless of call duration.

**Required setup (in ElevenLabs dashboard — not code):**
- Add the `voicemail_detection` system tool to each outbound voice agent
- Configure the agent to end the call (or leave a brief message) when voicemail is detected

**Approach B — Transcript-Based Detection in Reconciliation (Fallback)**

For calls where the voicemail tool wasn't triggered or isn't enabled yet, analyze the conversation transcript returned by the ElevenLabs API during reconciliation.

### Changes

#### 1. Update reconciliation logic to detect voicemail
**File:** `supabase/functions/elevenlabs-outbound-call/index.ts`

In the sync/reconciliation block (around lines 116-134), after fetching `convData` from ElevenLabs:

- Check if `convData.analysis?.tool_calls` or `convData.transcript` contains a `voicemail_detection` function call — if so, mark as `no_answer` regardless of duration
- As a fallback, scan the transcript for voicemail indicator phrases ("leave a message", "not available", "after the tone", "beep") when the agent spoke but received no meaningful human response
- Remove the hard-coded `durationSeconds < 15` threshold — replace with the voicemail detection logic above
- Keep the zero-duration check as-is (no duration = no answer)

```text
Current flow:
  duration = 0    → no_answer ✓
  duration < 15   → no_answer (assumed voicemail)
  duration >= 15  → completed (misses voicemail!)

New flow:
  duration = 0              → no_answer ✓
  voicemail tool triggered  → no_answer + sms ✓
  transcript has VM phrases → no_answer + sms ✓
  otherwise                 → completed (real conversation)
```

#### 2. Add voicemail detection flag to outbound_calls table
**Migration:** Add `voicemail_detected boolean default false` column to `outbound_calls` table so we can track and report on voicemail hits separately from true no-answers.

#### 3. Update SMS trigger condition
**File:** `supabase/functions/elevenlabs-outbound-call/index.ts` (line 370)

Change the SMS trigger from:
```
if (mappedStatus === 'no_answer' && retryCount === 0)
```
To:
```
if ((mappedStatus === 'no_answer' || voicemailDetected) && retryCount === 0)
```

This ensures SMS fires on both no-answer AND voicemail-detected calls on the first attempt.

#### 4. Webhook handler: detect voicemail from real-time webhook
**File:** `supabase/functions/elevenlabs-conversation-webhook/index.ts`

When the webhook fires with conversation data, check if the `analysis` or transcript contains a voicemail detection event. If so:
- Update the corresponding `outbound_calls` record with `voicemail_detected = true` and `status = 'no_answer'`
- Trigger the SMS follow-up immediately (don't wait for reconciliation cron)

This gives near-instant SMS delivery after voicemail detection instead of waiting 3-5 minutes for the next reconciliation cycle.

### ElevenLabs Dashboard Setup Required
After code deployment, you'll need to enable the **Voicemail Detection** system tool on each outbound voice agent in the ElevenLabs dashboard:
- Go to Agent Settings → Tools → System Tools → Enable "Voicemail Detection"
- Configure action: "End call" or "Leave brief message then end call"

### Summary

| What | How |
|------|-----|
| Detect voicemail | ElevenLabs system tool + transcript keyword fallback |
| Duration threshold | Removed — voicemail detection is content-based now |
| SMS trigger | Fires on `no_answer` OR `voicemail_detected` |
| Speed | Webhook path = instant SMS; reconciliation path = 1-3 min |
| Tracking | New `voicemail_detected` column on `outbound_calls` |
| Files changed | `elevenlabs-outbound-call/index.ts`, `elevenlabs-conversation-webhook/index.ts`, 1 migration |

