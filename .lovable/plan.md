

## Callback Scheduling via Voice Agent — Advisory & Implementation Plan

### Current State

The backend infrastructure is **already fully built**:

- **`agent-scheduling` edge function** — handles `check_availability`, `book_callback`, `get_next_slots` tools
- **`calendar-integration` edge function** — handles Nylas calendar queries, event creation, and `scheduled_callbacks` DB records
- **`scheduled_callbacks` table** — stores bookings with recruiter, time, status, Nylas event ID
- **`recruiter_availability_preferences` table** — configurable working hours, max daily callbacks, buffer times
- **`recruiter_calendar_connections` table** — Nylas OAuth grants for recruiter calendars
- **SMS confirmation** is sent after booking

### What Needs to Happen

The scheduling flow requires **ElevenLabs agent configuration** (done in the ElevenLabs web UI, not in code) plus one small code enhancement:

#### 1. ElevenLabs Agent Tool Configuration (Manual — ElevenLabs Dashboard)

Each voice agent that should support callbacks needs three webhook tools configured in the ElevenLabs agent settings:

| Tool Name | Webhook URL | Description |
|-----------|------------|-------------|
| `check_availability` | `https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/agent-scheduling` | Check recruiter calendar openings |
| `book_callback` | `https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/agent-scheduling` | Confirm and book a time slot |
| `get_next_slots` | `https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/agent-scheduling` | Quick query for next available times |

**Required parameters per tool:**

**`check_availability`:**
- `organization_id` (string, required) — the org UUID
- `driver_timezone` (string, optional) — e.g. "America/Chicago"

**`book_callback`:**
- `recruiter_user_id` (string, required) — returned by `check_availability`
- `organization_id` (string, optional)
- `application_id` (string, optional)
- `driver_name` (string, required) — candidate's name
- `driver_phone` (string, required) — candidate's phone
- `selected_slot_start` (string, required) — ISO 8601 datetime
- `notes` (string, optional)

**`get_next_slots`:**
- `organization_id` (string, required)

#### 2. Agent Prompt Update (ElevenLabs Dashboard)

Add scheduling instructions to each agent's system prompt, e.g.:

> "If the caller requests a callback or wants to schedule a call with a recruiter, use the `check_availability` tool with the organization_id to find open slots. Present 2-3 options. When the caller confirms a time, use `book_callback` with their name, phone number, and selected slot. Always confirm the booked time back to the caller."

#### 3. Code Enhancement — Pass `organization_id` to Agent Context

Currently, when a voice session starts, the `organization_id` is passed in the connection context but is **not** included as a dynamic variable that the ElevenLabs agent can use in tool calls. This is the one code change needed:

**File: `src/features/elevenlabs/hooks/useVoiceAgentConnection.ts`**

In the `connect` function (~line 285), add `organization_id` and `application_id` to the `dynamicVariables` object so the agent can reference them when calling the scheduling tools:

```typescript
const dynamicVariables: Record<string, string> = {
  job_title: context?.jobContext?.jobTitle || 'the driving position',
  company_name: context?.jobContext?.company || 'our company',
  candidate_name: context?.jobContext?.candidateName || 'there',
  // ... existing variables ...
  organization_id: context?.organizationId || context?.jobContext?.organizationId || '',
  application_id: context?.jobContext?.applicationId || '',
};
```

### Summary

| Item 				| Where | Status |
|----|----|----|
| `agent-scheduling` edge function | Supabase | Already deployed |
| `calendar-integration` edge function | Supabase | Already deployed |
| `scheduled_callbacks` table + RLS | Database | Already exists |
| Recruiter calendar connections (Nylas) | Database + UI | Already exists |
| Pass `organization_id` as dynamic variable | `useVoiceAgentConnection.ts` | **Code change needed** |
| Configure webhook tools on ElevenLabs agents | ElevenLabs Dashboard | **Manual config needed** |
| Add scheduling prompt instructions | ElevenLabs Dashboard | **Manual config needed** |
| Recruiter connects calendar via Nylas OAuth | `/calendar/callback` page | Already built |

The only code change is adding `organization_id` and `application_id` to dynamic variables. Everything else is ElevenLabs dashboard configuration.

