

## Plan: Re-queue 13 Failed Calls (Round 2) and Redeploy

All 13 re-queued calls failed because the API key lacked `convai_read` permission. Now that the key is unrestricted, we need to:

### Steps

1. **Insert 13 new `outbound_calls` records** with `status = 'queued'`, `retry_count = 0`, using the same `application_id`, `voice_agent_id`, `organization_id`, and `phone_number` from the previous attempt. Metadata will note `triggered_by: 'requeue_api_key_fix_v2'`.

2. **Redeploy `elevenlabs-outbound-call`** edge function so it picks up the now-unrestricted API key.

3. The cron job will automatically process the new queued calls within 1 minute.

### Technical Details

- Fresh inserts (not updates) to preserve the audit trail of the previous failed attempts.
- `scheduled_at = now()` for immediate eligibility.
- Same 13 applicants as before (Carolyn Askew through Steve Lewis).

