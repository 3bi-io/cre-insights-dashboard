

# Assign ElevenLabs Voice Agents to Admiral Merchants

## What This Does
Inserts two new voice agent records for **Admiral Merchants** (client ID `53d7dd20-d743-4d34-93e9-eb7175c39da1`, org `84214b48-7b51-45bc-ad7f-723bcf50466c`) — one inbound and one outbound — following the exact conventions used by existing clients like Danny Herman and Day & Ross.

## Records to Insert

| Field | Inbound Agent | Outbound Agent |
|-------|--------------|----------------|
| agent_name | Inbound Agent - Admiral Merchants | Outbound Agent - Admiral Merchants |
| elevenlabs_agent_id | agent_0501knj0pzarezf8v8z89gtd5epz | agent_9801knm3vmjvfh181zxfgjqpbnb3 |
| channels | phone, web | phone |
| is_outbound_enabled | false | true |
| llm_model | gpt-4o-mini | gpt-4o-mini |
| voice_id | 9BWtsMINqrJLrRacOk9x | 9BWtsMINqrJLrRacOk9x |
| is_active | true | true |

## Notes
- **Phone number IDs**: The ElevenLabs `phnum_` IDs for the two numbers (478-242-7759 and 612-260-7444) are not available from the user's message. These can be retrieved from the ElevenLabs dashboard and updated later, or I can query the ElevenLabs API to resolve them during implementation.
- **No code changes needed** — existing components (`VoiceApplyButton`, outbound call queue, `ClientCard`) will automatically pick up the new agents via the standard database-driven routing.

## Steps
1. Insert two rows into `voice_agents` table with the values above
2. Verify the records are created and active
3. Optionally query ElevenLabs API to resolve `agent_phone_number_id` values for both numbers

