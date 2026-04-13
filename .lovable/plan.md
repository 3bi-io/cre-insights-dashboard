

## Plan: Verify and Fix Twilio Auth Token for ElevenLabs Phone Import

### Problem
All 11 phone imports are still failing with Twilio Error 20003 (Authentication). The Account SID (`AC6e7c280b...`) is correct, but the Auth Token starting with `e018c0a1a...` is being rejected by Twilio (via ElevenLabs).

### Steps

1. **Create a temporary verification edge function** (`verify-twilio-creds`) that makes a direct Twilio API call (`GET /2010-04-01/Accounts/{SID}.json`) to confirm whether the current `TWILIO_AUTH_TOKEN` is valid. This isolates whether the problem is the token itself or something ElevenLabs-specific.

2. **Based on the result:**
   - If the direct call **succeeds**: The credentials are valid but ElevenLabs may need time to propagate, or there's a different issue with the `/create` endpoint format.
   - If the direct call **fails**: The Auth Token is wrong. You'll need to copy the exact token from [Twilio Console → Account Dashboard](https://console.twilio.com/) (click "Show" next to Auth Token).

3. **Once credentials are verified**, re-run the `update-elevenlabs-phones` function to import all 11 phone numbers.

4. **Update `voice_agents` table** with new phone number IDs returned by ElevenLabs.

5. **Clean up** temporary functions.

### Technical Details
- The verification function will log the token length and first 10 chars to help identify mismatches (e.g., trailing whitespace, wrong token copied).
- Twilio primary Auth Tokens are exactly 32 hex characters. If the length differs, the token is wrong.
- The `e018c0a1a...` prefix will be checked against the direct API response.

