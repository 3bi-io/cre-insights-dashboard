

# Create Hayes Outbound Voice Agent & Callback Jeremy Schuler

## What we'll do

1. **Insert a new voice agent record** for Hayes AI Recruiting with outbound enabled:
   - `agent_name`: "Outbound Agent - Hayes AI Recruiting"
   - `organization_id`: `84214b48-7b51-45bc-ad7f-723bcf50466c`
   - `client_id`: `49dce1cb-4830-440d-8835-6ce59b552012`
   - `elevenlabs_agent_id`: `agent_3201kfp75kshfgwr1kfs310715z3`
   - `agent_phone_number_id`: `phnum_6901kg7vdsf5em2sh1cc1933d8j4`
   - `is_outbound_enabled`: `true`
   - `is_active`: `true`
   - `voice_id`: `9BWtsMINqrJLrRacOk9x` (standard platform voice)
   - `llm_model`: `gpt-4o-mini`

2. **Trigger the outbound call** to Jeremy Schuler (application `e5913566-c664-41bb-96e5-d33823c09334`) by invoking the `elevenlabs-outbound-call` edge function with the new voice agent.

## Technical details

- Single SQL INSERT into `voice_agents` table using the Supabase insert tool
- One edge function invocation to initiate the callback
- No schema changes required

