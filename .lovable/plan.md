

## Aspenview Outbound Agent — End-to-End Implementation Plan

### Current State

- **Existing inbound agent**: `agent_7001kk37nfd8f5jv8zcpv5a96q8z` — active, `is_outbound_enabled = false`, no phone number
- **New outbound agent**: `agent_0901kkajxs22f42rfzhewmgh5jb8` — exists in ElevenLabs dashboard but **not registered** in the `voice_agents` table
- **Organization**: Aspen Analytics (`9335c64c-b793-4578-bf51-63d0c3b5d66d`)
- **Client**: Aspenview Technology Partners (`82513316-7df2-4bf0-83d8-6c511c83ddfb`)
- **Missing**: No `organization_call_settings` row for Aspen Analytics — business hours gating won't work
- **Missing**: No Twilio phone number registered for the new agent

### What Needs to Happen

#### 1. Register the outbound agent in `voice_agents`

Insert a new row with:
- `agent_name`: "Aspenview Outbound Screener"
- `agent_id` / `elevenlabs_agent_id`: `agent_0901kkajxs22f42rfzhewmgh5jb8`
- `organization_id`: `9335c64c-b793-4578-bf51-63d0c3b5d66d`
- `client_id`: `82513316-7df2-4bf0-83d8-6c511c83ddfb`
- `is_active`: true
- `is_outbound_enabled`: true
- `is_platform_default`: false
- `llm_model`: `gpt-4o-mini`
- `agent_phone_number_id`: **requires a Twilio number registered in ElevenLabs** — will need your input

#### 2. Create `organization_call_settings` for Aspen Analytics

Insert a default row with business hours appropriate for the cybersecurity vertical. Since Aspenview is based in San Juan, PR (AST = UTC-4, no DST), the settings should use `America/Puerto_Rico` timezone:
- `business_start`: `09:00`
- `business_end`: `17:00`
- `business_days`: `{1,2,3,4,5}` (Mon-Fri)
- `timezone`: `America/Puerto_Rico`
- `follow_up_enabled`: true

This can also have a client-specific row if different hours are needed.

#### 3. Adapt dynamic variables for cybersecurity vertical

The current `buildDynamicVariables()` in `elevenlabs-outbound-call` is heavily trucking-focused (CDL, hazmat, tanker, endorsements, freight type). For Aspenview's cybersecurity roles, these variables will all return defaults like "unknown" or "no" which is harmless but wastes context window.

**Add cyber-specific dynamic variables** to `buildDynamicVariables()`:
- `applicant_certifications` — extract from application data (CISSP, CISM, CEH, etc.)
- `applicant_clearance_level` — security clearance if stored
- `job_industry` — "cybersecurity" / "technology" based on category
- `job_certifications_required` — inferred from job title/description

These are additive — they won't break existing trucking agents since dashboard prompts only reference variables they know about.

#### 4. Configure the ElevenLabs dashboard agent

Since dashboard owns the system prompt (per our recent refactor), configure the agent at `agent_0901kkajxs22f42rfzhewmgh5jb8` with:
- **System prompt** referencing `{{applicant_first_name}}`, `{{company_name}}`, `{{job_title}}`, `{{job_location}}`, `{{is_after_hours}}`, `{{business_hours_note}}`, and the new cyber variables
- **First message override** enabled (code will personalize it)
- **Scheduling tools** (`check_availability`, `book_callback`, `get_next_slots`) pointed at `agent-scheduling` edge function
- **Data collection** for cybersecurity screening: certifications, clearance level, years in infosec, availability

#### 5. Register a Twilio phone number

The outbound call system requires `agent_phone_number_id` to be non-null. You need to:
1. Purchase/assign a Twilio number for Aspenview outbound calls
2. Register it in ElevenLabs under the agent's phone settings
3. Register CNAM as "Aspenview Technology" for caller ID

### Implementation Steps (code changes)

| Step | Detail |
|------|--------|
| **Migration** | Insert new `voice_agents` row + `organization_call_settings` row for Aspen Analytics |
| **Edge function** | Add cyber-specific variable inference to `buildDynamicVariables()` in `elevenlabs-outbound-call` |
| **No frontend changes** | The existing admin UI and outbound call system already handle multi-agent routing correctly via the priority hierarchy |

### Blocker Before Implementation

I need one piece of information from you:

**Do you have a Twilio phone number + ElevenLabs `agent_phone_number_id` ready for this agent?** Without it, the agent row can be inserted but outbound calls will fail the `agent_phone_number_id IS NOT NULL` check in the routing logic. If you don't have one yet, I can insert the row without it and you can update it later via the admin UI.

