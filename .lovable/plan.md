

## Plan: Update Twilio API Key from SKa56156 to SKdf66a3 Across All ElevenLabs Phone Records

### Problem
The Twilio API Key `SKa56156...` has been decommissioned. All ElevenLabs phone number records store this old key for telephony. Since PATCH doesn't update stored Twilio credentials, each phone record must be deleted and re-imported with the new key `SKdf66a3...`.

### Steps

1. **Update the `TWILIO_ACCOUNT_SID` secret** to the new API Key SID starting with `SKdf66a3`.

2. **Update the `TWILIO_AUTH_TOKEN` secret** to the API Secret that corresponds to the `SKdf66a3` key (if not already done).

3. **Create a temporary edge function** (`update-elevenlabs-phones`) that:
   - Lists all 11 unique phone number IDs from the `voice_agents` table
   - For each, calls `GET /v1/convai/phone-numbers/{id}` to capture the current phone number and label
   - Deletes the record via `DELETE /v1/convai/phone-numbers/{id}`
   - Re-imports it via `POST /v1/convai/phone-numbers/import` with the new `SKdf66a3` SID and matching auth token
   - Returns the old-to-new phone number ID mapping

4. **Update `voice_agents` table** — run UPDATE statements to replace old `agent_phone_number_id` values with the new IDs returned from ElevenLabs.

5. **Redeploy `elevenlabs-outbound-call`** to pick up the new secrets.

6. **Verify** — run a test call to confirm the full pipeline works with the new credentials.

7. **Re-queue the 13 failed applicant calls** if the test succeeds.

8. **Clean up** — delete the temporary edge function.

### Technical Details
- 11 distinct phone number IDs across all voice agents need re-importing
- ElevenLabs import endpoint: `POST /v1/convai/phone-numbers/import` with `telephony_provider: 'twilio'`, `phone_number`, `twilio_account_sid` (the new SK key), `twilio_auth_token` (the API secret), and `label`
- The `twilio-client.ts` shared utility reads `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` from env — no code changes needed there since it just uses whatever secret is set
- Multiple voice agents share the same phone number IDs, so the DB update must handle many-to-one mappings

### Prerequisites
Before I execute this plan, please confirm:
- You have already updated **both** `TWILIO_ACCOUNT_SID` (to `SKdf66a3...`) and `TWILIO_AUTH_TOKEN` (to the corresponding API Secret) in the project secrets. If not, please do so first.

