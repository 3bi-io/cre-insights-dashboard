
Goal: make outbound AI calls sound consistent from the first second and reduce “different question” drift across recent calls.

What I found
- The start-delay fix is already in place: `supabase/functions/elevenlabs-outbound-call/index.ts` sends `first_message_delay_ms: 1500`.
- Recent calls are coming from different outbound agents, not one single agent:
  - Danny Herman
  - Pemberton
  - Embed Form
- That means inconsistent questions can come from different ElevenLabs dashboard prompts/first messages/tool settings, even when the app code is the same.
- The code is no longer sending client-side `firstMessage` or `voiceId` overrides for web voice sessions, which is good.
- Recent outbound call records exist, but the matching local `elevenlabs_conversations` / `elevenlabs_transcripts` rows were not present for the conversation IDs I checked. That makes it hard to inspect exactly how each call opened and where question drift happened.

Implementation plan

1. Tighten outbound startup behavior
- Increase outbound `first_message_delay_ms` from 1500 to a more conservative value for phone calls.
- Make the delay easy to tune per agent/client instead of hardcoded globally.
- Default to a safer telephony value so the first line is less clipped and the voice sounds stable immediately.

2. Standardize what context the agent receives
- Audit `buildDynamicVariables()` in `elevenlabs-outbound-call` and trim it to stable, necessary facts.
- Keep personalization fields like applicant/job/company.
- Reduce or simplify instruction-like variables that can change question flow too much between call types, especially:
  - `business_hours_note`
  - follow-up / callback context
  - disqualification guidance
- This prevents the model from opening differently just because metadata changed.

3. Enforce one consistent outbound conversation structure
- Standardize the opening sequence for all outbound agents:
  - introduction
  - reason for call
  - confirmation question
  - qualification flow
- Keep this in the ElevenLabs dashboard prompt/first message for each outbound agent, since the current architecture is dashboard-centric.
- Align all active outbound agents to the same prompt version and first-message pattern unless a client truly needs a custom flow.

4. Fix transcript observability for recent outbound calls
- Ensure terminal outbound calls reliably create/update `elevenlabs_conversations`.
- Ensure transcripts are fetched and cached automatically for those conversations.
- This gives us a usable local audit trail to review openings, question order, interruptions, and agent drift after each call.

5. Add a consistency QA loop
- Review the last several completed outbound calls after transcript sync is reliable.
- Compare:
  - opening wording
  - first 3 agent questions
  - interruptions / corrections
  - whether after-hours logic changed the script too much
- Use that review to tune the shared outbound prompt and any per-agent exceptions.

Expected outcome
- Fewer clipped or shaky openings
- More uniform first questions across outbound calls
- Less agent drift between clients/agents
- Better auditability so future glitches can be diagnosed from local transcripts instead of guessing

Technical details
- Primary files to update:
  - `supabase/functions/elevenlabs-outbound-call/index.ts`
  - `supabase/functions/elevenlabs-call-status/index.ts`
  - `supabase/functions/elevenlabs-conversations/index.ts`
- Main code areas:
  - outbound telephony delay
  - dynamic variable shaping
  - transcript syncing for completed calls
- Non-code alignment needed:
  - ElevenLabs dashboard review for each active outbound agent’s prompt, first message, and tool configuration
