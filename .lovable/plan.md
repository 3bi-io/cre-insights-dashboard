

## Plan: Update Voice Agent Phone Number IDs

### Summary
Update 5 phone number IDs in the `voice_agents` table to reflect newly re-imported ElevenLabs phone numbers. One (Pemberton outbound) is already correct.

### Clarification Needed
**"Hayes - inbound"**: No agent named "Inbound Agent - Hayes" exists. Should the new Hayes inbound phone ID (`phnum_0501kp492f6ff5r89jsjmdt3jafr`) be applied to **"Inbound Agent - Global"** (`4da4a67c`)?

### Updates to Execute

| # | Agent Name | Record ID | Old Phone ID | New Phone ID |
|---|-----------|-----------|-------------|-------------|
| 1 | Inbound Agent - Pemberton | `4ad4e337` | `phnum_9501k96e...` | `phnum_1201kp49hfxkefetzzy08ssbjgbf` |
| 2 | Outbound Agent - Danny Herman | `0d300a8f` | `phnum_6901kg7v...` | `phnum_9101kp49kg55f73vtdv7tgqb70eg` |
| 3 | Outbound Agent - Hayes AI Recruiting | `5af69ab6` | `phnum_6901kg7v...` | `phnum_9401kp47a9hwfg3awrjfsb3k7w96` |
| 4 | Outbound Agent - James Burg Trucking | `23981299` | `phnum_01jzpapr...` | `phnum_4201kp49bbv2fe185kz96m4c1xwn` |
| 5 | Inbound Agent - Global (Hayes?) | `4da4a67c` | `phnum_3801k1yf...` | `phnum_0501kp492f6ff5r89jsjmdt3jafr` |

Pemberton outbound is already up to date — no change needed.

### Technical Details
- Single migration with 5 UPDATE statements against `voice_agents`
- Each sets `agent_phone_number_id` and `updated_at = now()`
- No code changes required — the edge functions already read phone IDs from this table dynamically

