

## Plan: Re-push Updated Twilio SID to ElevenLabs and Re-queue Calls (Round 5)

### Problem
The Twilio Account SID was updated, but the three ElevenLabs phone number records still have the old SID. ElevenLabs uses those stored credentials when placing calls, causing the persistent `HTTP 401: Authenticate` error.

### Steps

1. **Update ElevenLabs phone records with new Twilio SID** — Create and run a temporary edge function that PATCHes all three ElevenLabs phone IDs with the current `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` from project secrets:
   - `phnum_0001k48rgfw7fbfbr0p6njkt54n5` (Pemberton, +12149721334)
   - `phnum_4301k2678yq4e5va2pee8e11wdjz` (Danny Herman, +12512775924)
   - `phnum_5301khcb0877fkpt3t3e57qd0gba` (James Burg, +15864745525)

2. **Verify** each phone record via GET to confirm the updated SID is active.

3. **Redeploy `elevenlabs-outbound-call`** to pick up the new `TWILIO_ACCOUNT_SID` secret.

4. **Re-queue the 13 failed calls** with fresh inserts (`status = 'queued'`, `retry_count = 0`, metadata `triggered_by: 'requeue_twilio_sid_fix_v5'`).

5. **Clean up** the temporary edge function.

### Technical Details
- Uses ElevenLabs API `PATCH /v1/convai/phone-numbers/{id}` with `telephony_provider: 'twilio'`, the new `twilio_account_sid`, `twilio_auth_token`, and `phone_number`.
- Fresh DB inserts preserve the audit trail of all prior failed rounds.

