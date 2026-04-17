

## Investigation: Danny Herman calls stuck on "initiated"

### What I found
The most recent Danny Herman call is stuck:
- Call `713e5a07...` — Jose Luis Cabrera, phone `+19564132242`, ElevenLabs conv `conv_0001kpe3f6dyey8ay0tfmve5xf7j`, status `initiated` since 16:13 UTC (≈19 min ago).
- Previous attempt to same applicant (`caa9e404...`, retry 0) resolved correctly to `no_answer` at 16:12 — so the retry cron fired the new call, which then got stuck.
- The `sync-stuck-outbound-calls` cron (every 3 min) IS running and IS polling this call. Logs show three successful syncs at 16:24 / 16:27 / 16:30, each one returning ElevenLabs status `"initiated"`.

### Root cause
The ElevenLabs conversation API is reporting the conversation status as `initiated` (not `done`/`failed`/`no-answer`). The sync function is working correctly — it has a guard that only force-resolves a hung call to `no_answer` once it is **30+ minutes old** (`elevenlabs-outbound-call/index.ts` lines 296–300). The Cabrera call is only 19 minutes old, so it's correctly waiting. It will auto-resolve to `no_answer` on the sync that runs after ~16:43 UTC.

This appears to be an ElevenLabs/Twilio session that never received a terminal event from the carrier — possibly a number that rings indefinitely, voicemail without ElevenLabs detecting hangup, or a dropped Twilio leg without ElevenLabs being notified. Same applicant/phone failed both attempts, which suggests it's number-specific (carrier or VM behavior on +19564132242), not a system bug.

### Verdict
- The system is **not broken**. The auto-resolve safety net at 30 min will clear it.
- However, **30 minutes is too long** for a call to appear "stuck" in the dashboard, and we have no protection against retry storms (the retry from the prior attempt happened correctly, but if this new one resolves to `no_answer` again the retry chain continues).

### Proposed fixes (pick what you want)

1. **Tighten the force-resolve threshold** in `elevenlabs-outbound-call/index.ts` from 30 min → 10 min. A real ElevenLabs call rarely runs past 5 min; anything still "initiated" after 10 min is hung. One-line change (line 297).

2. **Add a Twilio call-status fallback**: when ElevenLabs reports `initiated` but the call is older than 5 min, also query Twilio's Call resource using `call_sid` (we have it stored). If Twilio reports `completed`/`no-answer`/`busy`/`failed`, use that as the source of truth. This catches the exact failure mode we just hit.

3. **Cap retries per phone-number/applicant**: skip auto-retry if the same applicant already has 2+ `no_answer` calls in the last 24h, to avoid burning calls on numbers that never answer (Cabrera's case).

### What does NOT change
- Cron schedules (1 min queue, 3 min sync) — already correct.
- Voicemail detection logic — unchanged.
- Status mapping for `done`/`failed`/`no-answer`/`busy` — unchanged.

### Recommendation
Do all three. They're independent, low-risk, and together they (a) clear stuck UI faster, (b) close the ElevenLabs gap with Twilio truth, and (c) stop wasted retries on dead numbers.

