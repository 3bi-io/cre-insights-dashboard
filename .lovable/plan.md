
## Implement Voice Agent Fixes (Items 2-5)

This plan addresses four issues found during the inbound agent review.

### 1. Fix Danny Herman Outbound Agent Flag

The "Outbound Agent - Danny Herman" has `is_outbound_enabled = false`, causing the sync-voice-applications poller to incorrectly include it as an inbound agent.

**Database update:** Set `is_outbound_enabled = true` for agent ID `0d300a8f-f7b8-4108-9af1-0e20befb321b`.

### 2. Add Phone Number Normalization to Transcript Parser

Currently, phone numbers like `"eight one seven seven five seven two eight two eight"` are stored as-is. The `parseSpokenNumber` function already exists in the transcript parser but isn't applied to phone fields.

**Changes to `supabase/functions/_shared/transcript-parser.ts`:**
- Add a new `phone` field to `ExtractedData` interface
- Add `extractPhone()` function that finds phone numbers in the transcript and applies `parseSpokenNumber` to convert spoken digits to numeric format
- Call it from `extractFromTranscript()`

**Changes to both edge functions (`sync-voice-applications` and `elevenlabs-conversation-webhook`):**
- After extracting the phone value from `data_collection_results`, apply spoken-number normalization if it contains word characters (e.g., "eight one seven...")
- Normalize to E.164 format (+1XXXXXXXXXX) before storing

### 3. Assign Independent Inbound Agents to Hayes Recruiting

The 3 "Independent Inbound Agent" records have `organization_id = NULL`, which prevents the job-listing lookup from finding matches (17/19 applications had `job_listing_id = NULL`).

**Database update:** Set `organization_id = '84214b48-7b51-45bc-ad7f-723bcf50466c'` (Hayes Recruiting Solutions) for agents:
- `4c776662-3bd9-4af1-9374-e2d241b62bf2` (Independent Inbound Agent 1)
- `62f01aa5-08c4-4596-b912-e035ffdd7f45` (Independent Inbound Agent 2)
- `6b27c708-00fb-43c9-a747-afa7bcd684f7` (Independent Inbound Agent 3)

### 4. Add Email/Phone Deduplication

Both `sync-voice-applications` and `elevenlabs-conversation-webhook` currently only deduplicate by `conversation_id`. A caller who phones in twice with the same phone/email creates duplicate applications.

**Changes to both edge functions:**
- After extracting contact info (email/phone), before inserting, query `applications` table for existing records matching the same email or normalized phone within the same job listing (or same organization if no job listing)
- If a match is found within the last 24 hours, skip creation and log it as a duplicate
- This prevents rapid duplicate submissions while still allowing legitimate re-applications after a cooling period

### Technical Summary

| Change | Files |
|--------|-------|
| Danny Herman outbound flag | DB update (migration) |
| Phone normalization | `_shared/transcript-parser.ts`, `sync-voice-applications/index.ts`, `elevenlabs-conversation-webhook/index.ts` |
| Assign independent agents to org | DB update (migration) |
| Email/phone deduplication | `sync-voice-applications/index.ts`, `elevenlabs-conversation-webhook/index.ts` |

### Deployment

Both `sync-voice-applications` and `elevenlabs-conversation-webhook` edge functions will be redeployed after code changes. The database updates take effect immediately.
