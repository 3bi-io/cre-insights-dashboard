

## Plan: Configure Twilio Phone Numbers via ElevenLabs API and Re-queue Failed Calls

### Context

All 13 re-queued outbound calls failed with "Exceeded maximum retry attempts" because the underlying ElevenLabs-to-Twilio connection was returning `HTTP 401: Unable to create record: Authenticate`. The Twilio credentials stored in ElevenLabs for each phone number are invalid or expired. The user has provided the correct Twilio phone numbers for three clients.

### Phone Number Mapping

| Client | ElevenLabs Phone ID | Twilio Number |
|--------|---------------------|---------------|
| Pemberton Truck Lines | `phnum_0001k48rgfw7fbfbr0p6njkt54n5` | +12149721334 |
| Danny Herman Trucking | `phnum_4301k2678yq4e5va2pee8e11wdjz` | +12512775924 |
| James Burg Trucking | `phnum_5301khcb0877fkpt3t3e57qd0gba` | +15864745525 |

### Steps

1. **Create a one-off edge function script** that uses the ElevenLabs API (`PUT /v1/convai/phone-numbers/{phone_number_id}`) to update each of the three phone number records with the correct Twilio credentials (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`) and the corresponding phone number. This uses the existing `ELEVENLABS_API_KEY`, `TWILIO_ACCOUNT_SID`, and `TWILIO_AUTH_TOKEN` secrets already configured in the project.

2. **Verify the configuration** by calling `GET /v1/convai/phone-numbers/{phone_number_id}` for each to confirm the Twilio integration is active.

3. **Re-queue the 13 failed applicant calls** with fresh `outbound_calls` inserts (`status = 'queued'`, `retry_count = 0`, metadata `triggered_by: 'requeue_twilio_fix_v3'`). These are the same 13 applicants from previous rounds.

4. **Redeploy `elevenlabs-outbound-call`** to pick up any cached state changes.

### Technical Details

- The ElevenLabs Phone Numbers API allows updating Twilio provider credentials per phone number via `POST /v1/convai/phone-numbers/create` or `PATCH` endpoints with `twilio_account_sid`, `twilio_auth_token`, and `phone_number` fields.
- The script will run as a direct `curl`/`fetch` call from `code--exec` using the existing secrets, not as a permanent edge function.
- Fresh queue inserts preserve the audit trail of all previous failed attempts.

