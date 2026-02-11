

## Append Outbound Call Transcript to Tenstreet CustomQuestions

### Overview

When sending an application to Tenstreet, look up the associated outbound call, retrieve the full transcript from `elevenlabs_transcripts`, and append it as the **last CustomQuestion** in the XML payload.

### Data Path

```text
applications.id
  -> outbound_calls.application_id (get elevenlabs_conversation_id)
    -> elevenlabs_conversations.conversation_id (get internal UUID id)
      -> elevenlabs_transcripts.conversation_id (get all messages ordered by sequence_number)
```

### Changes

**File 1: `supabase/functions/ats-integration/index.ts` (lines ~135-180)**

After existing enrichment (company_name, apply_url, powered_by), add a new block:

1. Query `outbound_calls` where `application_id = appData.id` and `status = 'completed'` (or any status with a conversation), ordered by `created_at DESC`, limit 1
2. If found with `elevenlabs_conversation_id`, look up `elevenlabs_conversations` to get the internal UUID `id`
3. Query `elevenlabs_transcripts` where `conversation_id = {internal_uuid}`, ordered by `sequence_number`
4. Build a formatted transcript string:
   ```
   Agent: Hello Constantine! This is...
   Caller: Yes, I'm interested...
   Agent: Great! Can you tell me...
   ```
5. Attach to `appData.call_transcript = formattedTranscript`
6. Also attach any `data_collection_results` from the conversation metadata if available, to supplement existing compliance fields

**File 2: `supabase/functions/_shared/ats-adapters/xml-post-adapter.ts` (lines ~427-450)**

After the existing CustomQuestions block (consent, privacy, etc.) and before closing the `</CustomQuestions>` tag:

1. Check if `application.call_transcript` exists and is non-empty
2. If so, append it as the final CustomQuestion:
   ```xml
   <CustomQuestion>
     <Question>Voice Application Transcript</Question>
     <Answer>{full transcript text}</Answer>
   </CustomQuestion>
   ```
3. The transcript text will be XML-escaped via the existing `escapeXml()` method

### Expected Output (appended to existing CustomQuestions)

```xml
<CustomQuestions>
  <!-- existing compliance questions -->
  <CustomQuestion>
    <Question>Can you pass a drug screening?</Question>
    <Answer>Yes</Answer>
  </CustomQuestion>
  <!-- ... other questions ... -->
  <CustomQuestion>
    <Question>Voice Application Transcript</Question>
    <Answer>Agent: Hello Constantine! This is the recruiting team from Pemberton Truck Lines calling about your driving application. Is now a good time to chat?
Caller: Yes, go ahead.
Agent: Great! Do you currently hold a Class A CDL?
Caller: Yes I do.
...</Answer>
  </CustomQuestion>
</CustomQuestions>
```

### Edge Cases

- **No outbound call found**: Skip -- no transcript question added
- **Call initiated but no transcript yet**: Skip -- transcript array is empty
- **Multiple outbound calls**: Use the most recent completed call
- **Very long transcripts**: Include full text (Tenstreet accepts large answer fields)
- **Constantine's current call**: Status is `initiated` with no transcript data yet -- transcript question will be skipped until a completed call exists

### Summary

| File | Change |
|---|---|
| `ats-integration/index.ts` | After line ~180: query outbound_calls -> elevenlabs_conversations -> elevenlabs_transcripts, build formatted transcript string, attach as `appData.call_transcript` |
| `xml-post-adapter.ts` | After line ~427: if `call_transcript` exists, append as final `<CustomQuestion>` with question "Voice Application Transcript" |

