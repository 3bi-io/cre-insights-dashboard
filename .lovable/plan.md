

## WhatsApp as a Voice Agent Channel — Advisory & Implementation Plan

### How ElevenLabs WhatsApp Works

ElevenLabs launched native WhatsApp support (Dec 2025). The key architectural point: **WhatsApp is configured entirely in the ElevenLabs dashboard, not via API.** The flow is:

1. Import a WhatsApp Business account in the ElevenLabs Agents dashboard
2. Assign an existing agent to that WhatsApp account
3. The agent handles both text and voice messages on WhatsApp automatically — same prompt, same tools, same voice

This means there is **no new edge function or API integration needed** to "connect" WhatsApp. The ElevenLabs platform handles the WhatsApp ↔ agent bridge natively. Your existing agents (with their prompts, dynamic variables, scheduling tools) work on WhatsApp without code changes.

### What Your Platform Needs

The value-add for your platform is **tracking and managing** which agents have WhatsApp enabled, and surfacing that in the admin UI. Here's what to implement:

#### 1. Add `channels` column to `voice_agents` table

Track which channels each agent is deployed on:

```sql
ALTER TABLE voice_agents 
  ADD COLUMN channels text[] NOT NULL DEFAULT '{phone}';
```

Valid values: `phone`, `web`, `whatsapp`. This is informational — the actual channel enablement happens in the ElevenLabs dashboard. The column lets your admin UI show which agents are WhatsApp-enabled.

#### 2. Add `whatsapp_phone_number_id` to `voice_agents`

When an agent is connected to WhatsApp in ElevenLabs, the WhatsApp Business phone number ID should be stored for reference:

```sql
ALTER TABLE voice_agents 
  ADD COLUMN whatsapp_phone_number_id text DEFAULT NULL;
```

#### 3. Update the Admin UI — Agent Form

In the voice agent creation/editing form, add:
- A multi-select for **Channels** (Phone, Web, WhatsApp) — stored in the `channels` column
- A text input for **WhatsApp Phone Number ID** — only visible when WhatsApp is selected
- An info callout explaining that WhatsApp must also be configured in the ElevenLabs dashboard

#### 4. Update the Admin UI — Agent List

Show channel badges (Phone, Web, WhatsApp) on each agent card in the agents list view, so admins can see at a glance which agents are deployed where.

#### 5. Update TypeScript types

Add `channels` and `whatsapp_phone_number_id` to the `VoiceAgent` interface in `src/features/elevenlabs/types/index.ts`.

#### 6. Update outbound call trigger (optional enhancement)

The `trigger_application_insert_outbound_call()` function currently only queues phone calls. A future enhancement could queue WhatsApp messages for agents that have `'whatsapp' = ANY(channels)` — but this requires the ElevenLabs WhatsApp API to support programmatic outbound messaging, which is currently dashboard-only.

### What NOT to Build

- **No new edge function for WhatsApp messaging** — ElevenLabs handles the WhatsApp ↔ agent bridge natively
- **No WhatsApp Business API integration** — the existing `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_ACCESS_TOKEN` secrets in `verify-platform-secrets` are for the Social Beacon feature, not for voice agents
- **No changes to the conversation/transcript system** — ElevenLabs WhatsApp conversations flow through the same conversation sync pipeline

### Implementation Summary

| Change | Scope |
|--------|-------|
| Migration: add `channels` + `whatsapp_phone_number_id` columns | 1 SQL migration |
| Update `VoiceAgent` type | 1 type file |
| Admin UI: channel selector in agent form | 1 component |
| Admin UI: channel badges in agent list | 1 component |
| Dashboard setup instructions | Documentation/callout in UI |

### Dashboard Setup Steps (for you to do manually)

1. Go to ElevenLabs Agents dashboard
2. Select the agent (e.g., Aspenview Outbound Screener)
3. Navigate to **Channels** → **WhatsApp**
4. Import your WhatsApp Business account
5. Assign the agent to the WhatsApp number
6. The agent will immediately handle inbound WhatsApp messages using the same prompt and tools

This is a lightweight implementation — the heavy lifting is done by ElevenLabs natively. Your platform just needs to track and display which agents are WhatsApp-enabled.

