

## Plan: Attach Outbound Voice Agent Phone to Admiral Merchants & Verify System

### Current State
- **Admiral Merchants outbound agent** (`8a10a805-fcaf-4e8f-b5e5-423f7025afc3`) exists with `elevenlabs_agent_id: agent_9801knm3vmjvfh181zxfgjqpbnb3`, `is_outbound_enabled: true`, but **`agent_phone_number_id` is NULL** — outbound calls cannot route.
- **Inbound agent** (`a21d2baf-3e97-455b-9dc0-225cacb861c7`) exists and is active.
- **Email templates** already cover all 5 lifecycle stages (application_received, status_update, interview_invitation, offer, rejection) with branded headers, client logo support, and "Complete Your Full Application" CTAs. These are fully functional via the `send-application-email` edge function.
- **Cron jobs** are all healthy:
  - `process-outbound-call-queue` — every 1 minute ✅
  - `sync-stuck-outbound-calls` — every 3 minutes ✅
  - All other crons (feed sync, digest, indexing, syndication) running correctly ✅

### What Needs to Happen

**1. Update Admiral Merchants outbound agent with phone number ID**

Run a SQL update on `voice_agents` to set `agent_phone_number_id = 'phnum_8901kp9fhf1xe6htj5mqx6jgqf7x'` for the outbound agent record (`id: 8a10a805-fcaf-4e8f-b5e5-423f7025afc3`).

This is the single blocking issue — without the phone number ID, the outbound call edge function cannot initiate calls for Admiral Merchants applicants.

**2. Verify email template delivery for Admiral Merchants**

No code changes needed. The existing `send-application-email` edge function already:
- Sends branded emails with Admiral Merchants' logo and company name
- Includes the "Complete Your Full Application" CTA with pre-filled link
- Covers all 5 email types (received, status update, interview, offer, rejection)

**3. Confirm cron schedule (already verified)**

All crons are running at optimal frequencies. No changes needed.

### Summary of Changes

| Action | Detail |
|--------|--------|
| **DB Update** | Set `agent_phone_number_id = 'phnum_8901kp9fhf1xe6htj5mqx6jgqf7x'` on outbound voice agent `8a10a805-fcaf-4e8f-b5e5-423f7025afc3` |
| **Email templates** | Already built — no changes needed |
| **Cron jobs** | Already running — no changes needed |

### Technical Detail
The update will be executed via the Supabase insert tool (data update, not schema change):
```sql
UPDATE voice_agents 
SET agent_phone_number_id = 'phnum_8901kp9fhf1xe6htj5mqx6jgqf7x',
    updated_at = now()
WHERE id = '8a10a805-fcaf-4e8f-b5e5-423f7025afc3';
```

After this single update, Admiral Merchants outbound calls will be fully operational — new applicants will be automatically queued for screening calls by the existing cron infrastructure.

