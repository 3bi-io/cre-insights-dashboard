

## Plan: Update James Burg Inbound Agent Phone Number ID

### Summary
Update the phone number ID for the "Inbound Agent - James Burg" record to the new ElevenLabs phone number.

### Update

| Agent Name | Record ID | Current Phone ID | New Phone ID |
|-----------|-----------|-----------------|-------------|
| Inbound Agent - James Burg | `60c3b369-3e40-476b-aeab-a39e741d9298` | (none) | `phnum_2801kp4b2tpdemr98yc0wgwqw22s` |

### Technical Details
- Single UPDATE statement against `voice_agents` table using the insert tool
- Sets `agent_phone_number_id` and `updated_at = now()`
- No code changes needed

