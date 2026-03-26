

## Analysis: Voice Agent Start-of-Call Glitches

### What I found

After reviewing the last 10 outbound calls and the full codebase:

- **Server-side code is clean**: The `elevenlabs-outbound-call` edge function sends only `dynamic_variables` — no `first_message`, `overrides`, or `voiceId` overrides that could conflict with the dashboard agent
- **Client-side code is clean**: The previous fix already removed `firstMessage` overrides from `useVoiceAgentConnection`
- **No errors in logs**: Edge function logs show only normal `process_queue` and `sync_initiated` cycles
- **Recent calls look healthy**: Completed calls had good durations (84s, 102s, 210s, 85s)

### Root cause

The start-of-call glitches (stuttering, clipped first words) are happening at the **ElevenLabs/Twilio WebSocket handshake layer**, not in our code. When Twilio connects the call to ElevenLabs, there's a brief delay before audio streaming stabilizes. The agent's first message starts playing before the audio path is fully ready, causing the first 1-2 seconds to sound garbled.

### Recommended fix

Add a **`first_message_delay_ms`** parameter to the ElevenLabs outbound call payload. This tells ElevenLabs to wait a brief moment after the call connects before speaking, giving the Twilio-ElevenLabs audio bridge time to stabilize.

### Changes

**File: `supabase/functions/elevenlabs-outbound-call/index.ts`** (lines ~1146-1155)

Add a small startup delay to the conversation initiation data:

```typescript
const conversationInitData: Record<string, unknown> = {
  dynamic_variables: dynamicVariables
};

const elevenLabsPayload: Record<string, unknown> = {
  agent_id: voiceAgent.elevenlabs_agent_id,
  agent_phone_number_id: voiceAgent.agent_phone_number_id,
  to_number: normalizedPhone,
  conversation_initiation_client_data: conversationInitData,
  first_message_delay_ms: 1500  // Wait 1.5s after connect before speaking
};
```

This 1.5-second delay lets Twilio's audio stream fully establish before the agent starts its greeting, eliminating the clipped/garbled first words.

### Also recommended (ElevenLabs dashboard)

- In the agent's first message, add a brief filler like "Hello!" before the main greeting. This gives additional buffer so if any clipping occurs, it's on a throwaway word rather than the candidate's name.
- Example: `Hello! Hi {{applicant_first_name}}, this is the recruiting assistant from {{company_name}}...`

