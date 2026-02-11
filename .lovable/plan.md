

## Fix: Outbound Call Status Sync + Auto-Fetch Transcripts for Tenstreet

### Problem Summary

The transcript enrichment for Tenstreet payloads is broken due to two issues:

1. **Outbound call status stays `initiated` forever** -- The call to ElevenLabs succeeds and the conversation completes (`done`), but the `outbound_calls` record never updates to `completed`. The Tenstreet enrichment code filters on `status = 'completed'`, so it never finds the call.

2. **Transcripts are never auto-fetched** -- Even if the status were correct, the `elevenlabs_transcripts` table has 0 rows for these conversations. Transcripts are only stored when someone manually triggers the `get_transcript` action.

### Current Data State (Constantine)

| Table | Record | Status | Issue |
|---|---|---|---|
| outbound_calls | 24f4f6ed... | `initiated` | Should be `completed` |
| elevenlabs_conversations | af0167a2... | `done` | Correct (from ElevenLabs) |
| elevenlabs_transcripts | (none) | 0 rows | Never fetched |

### Plan

#### Change 1: Broaden status filter in `ats-integration/index.ts`

Currently line 143 filters `.eq('status', 'completed')`. Change to accept any call that has an `elevenlabs_conversation_id` (indicating it actually connected), regardless of status:

```
- .eq('status', 'completed')
+ .in('status', ['completed', 'initiated', 'in_progress'])
+ .not('elevenlabs_conversation_id', 'is', null)
```

This ensures calls like Constantine's (status `initiated` but conversation exists and is `done`) are picked up.

#### Change 2: Auto-fetch transcript inline during Tenstreet enrichment

In the same enrichment block in `ats-integration/index.ts`, after finding the conversation record but finding 0 local transcripts, call the ElevenLabs API directly to fetch and store the transcript:

1. Check if `elevenlabs_transcripts` has rows for the conversation
2. If not, fetch from ElevenLabs API: `GET /v1/convai/conversations/{conversation_id}`
3. Store the transcript messages into `elevenlabs_transcripts` (same upsert logic as `elevenlabs-conversations/index.ts`)
4. Then use those messages to build the formatted transcript

This eliminates the dependency on a separate manual sync step.

#### Change 3: Sync outbound call status during enrichment

While fetching the conversation from ElevenLabs, also update the `outbound_calls` status to `completed` if the ElevenLabs conversation status is `done`. This fixes the data for future queries and dashboards.

### Technical Details

**File: `supabase/functions/ats-integration/index.ts` (enrichment block, lines ~137-182)**

Replace the current enrichment block with:

1. Query `outbound_calls` with broadened filter (any status with a conversation_id)
2. Look up `elevenlabs_conversations` to get internal UUID
3. Check local `elevenlabs_transcripts` for existing messages
4. If no local transcripts exist:
   - Fetch from ElevenLabs API using `ELEVENLABS_API_KEY` secret
   - Store transcript messages via upsert
   - Update `outbound_calls.status` to `completed` if ElevenLabs says `done`
5. Build formatted transcript string and attach to `appData.call_transcript`

**File: `supabase/functions/ats-integration/index.ts` (top of file)**

Add `ELEVENLABS_API_KEY` retrieval from `Deno.env.get()` at the top of the handler (it may already be available or need to be added).

### Data Flow After Fix

```text
Tenstreet send_application request
  -> Query outbound_calls (any status with conversation_id)
  -> Found: Constantine's call (status=initiated, conv=conv_8501...)
  -> Look up elevenlabs_conversations -> af0167a2...
  -> Check elevenlabs_transcripts -> 0 rows
  -> Fetch from ElevenLabs API -> get transcript messages
  -> Store in elevenlabs_transcripts
  -> Update outbound_calls.status -> completed
  -> Build formatted transcript
  -> Append as CustomQuestion in XML payload
```

### Edge Cases

- **ElevenLabs API key not available**: Log warning, skip transcript (graceful degradation)
- **Conversation not found in ElevenLabs**: Skip transcript, log the issue
- **Transcript already exists locally**: Use local data, no API call needed
- **Multiple outbound calls for same application**: Use most recent with a conversation_id
- **Calls without application_id**: Not affected (these are already linked via application_id)

