

## Plan: Verify Twilio Credentials End-to-End and Re-queue Calls (Round 6)

### Problem
All v5 calls exhausted their 3 retries within 6 minutes of being queued — likely before ElevenLabs propagated the updated Twilio SID. The error logs have rotated, so the exact failure reason is unconfirmed. We need to verify the credentials are now working before re-queuing.

### Steps

1. **Verify ElevenLabs phone records have correct Twilio SID** — Create a temporary edge function that calls `GET /v1/convai/phone-numbers/{id}` for all three phone IDs and returns the stored `twilio_account_sid` (masked) so we can confirm they match the current secret.

2. **Test a single outbound call** — Queue just 1 test call to confirm the full pipeline works end-to-end (ElevenLabs → Twilio → phone rings). Wait for it to process before proceeding.

3. **If test succeeds, re-queue the remaining 13 applicant calls** — Fresh inserts with `status = 'queued'`, `retry_count = 0`, metadata `triggered_by: 'requeue_verified_v6'`.

4. **Clean up** the temporary verification function.

### Technical Details
- Step 1 uses the `ELEVENLABS_API_KEY` secret to query the phone number API directly.
- Step 2 inserts a single outbound_calls record and monitors its status for ~2 minutes.
- Step 3 only proceeds after confirmed success from step 2.
- This staged approach avoids wasting all 3 retries on still-stale credentials.

