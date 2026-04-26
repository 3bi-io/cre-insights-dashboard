# ElevenLabs Voice Agent — Scheduling Workflow Setup

End-to-end configuration for booking, rescheduling, and cancelling driver
callbacks against **Google Calendar** and **Microsoft 365 / Exchange**
calendars via Nylas v3.

---

## 1. Backend resources (already deployed)

| Resource | Purpose |
|---|---|
| `calendar-integration` edge function | Nylas OAuth, availability check, event create/reschedule/cancel, conferencing (Google Meet / Microsoft Teams), driver participant invites, ICS email confirmations. |
| `agent-scheduling` edge function | ElevenLabs tool dispatcher: `check_availability`, `book_callback`, `get_next_slots`, `reschedule_callback`, `cancel_callback`, `get_my_callback`. |
| `scheduling-reminders` edge function | Cron-driven worker that processes the `scheduling_reminders` queue (1h driver SMS+email, 15m recruiter email). |
| `scheduled_callbacks` table | Adds `driver_email`, `conference_url`, `reschedule_count`, `previous_event_ids`, `reminder_sent_at`. |
| `scheduling_reminders` table | Pending/sent/failed reminder queue, idempotent claim via status flip. |

## 2. Required secrets

Already required (no action):

- `NYLAS_API_KEY`, `NYLAS_CLIENT_ID`, `NYLAS_REDIRECT_URI`
- `RESEND_API_KEY`, `LOVABLE_API_KEY` (for confirmation + reminder emails)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `RESEND_FROM_EMAIL` — defaults to `Apply AI <onboarding@resend.dev>`.

## 3. Cron schedule for reminders

Run **once** in the Supabase SQL Editor (replace `YOUR_ANON_KEY`):

```sql
-- Ensure required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule scheduling-reminders every minute
select cron.schedule(
  'scheduling-reminders-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/scheduling-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY'
    ),
    body := jsonb_build_object('triggered_at', now())
  );
  $$
);
```

To pause: `select cron.unschedule('scheduling-reminders-every-minute');`

## 4. ElevenLabs agent tools

Add the following **webhook tools** to each scheduling-capable ElevenLabs
agent. Webhook URL for all tools:

```
https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/agent-scheduling
```

Method: `POST` · Auth: none required (the function is publicly invocable
and validates inputs server-side).

### Tool: `check_availability`

Returns up to 3 next available slots from any connected recruiter calendar.

```json
{
  "tool_name": "check_availability",
  "parameters": {
    "organization_id": "<uuid>",
    "client_id": "<uuid|optional>",
    "application_id": "<uuid|optional>",
    "driver_timezone": "America/Chicago"
  }
}
```

### Tool: `book_callback`

Books one of the slots returned by `check_availability`. Creates a calendar
event with **automatic Google Meet / Teams conferencing link**, adds the
driver as a participant (email invite), and queues SMS + email reminders.

```json
{
  "tool_name": "book_callback",
  "parameters": {
    "recruiter_user_id": "<uuid>",
    "organization_id": "<uuid>",
    "application_id": "<uuid|optional>",
    "driver_name": "Jane Driver",
    "driver_phone": "+15551234567",
    "driver_email": "jane@example.com",
    "selected_slot_start": "2026-04-28T15:00:00Z",
    "selected_slot_end": "2026-04-28T15:15:00Z",
    "notes": "Asked about home time"
  }
}
```

### Tool: `reschedule_callback`

Looks up the active callback (by `callback_id`, or `application_id`, or
`driver_phone`), deletes the old Nylas event, creates a new one, and
re-queues reminders.

```json
{
  "tool_name": "reschedule_callback",
  "parameters": {
    "application_id": "<uuid>",
    "new_slot_start": "2026-04-29T16:00:00Z",
    "driver_timezone": "America/Chicago"
  }
}
```

### Tool: `cancel_callback`

Cancels the calendar event and any pending outbound calls; optionally
records a reason.

```json
{
  "tool_name": "cancel_callback",
  "parameters": {
    "application_id": "<uuid>",
    "reason": "Found a different position"
  }
}
```

### Tool: `get_my_callback`

Reads back the next active callback so the agent can confirm details.

```json
{
  "tool_name": "get_my_callback",
  "parameters": { "application_id": "<uuid>" }
}
```

## 5. Recruiter onboarding (frontend)

In **Voice Admin → Calendar Integration**:

1. Pick a client (or "Organization-Level").
2. Click **Connect Google Calendar** or **Connect Microsoft 365** —
   provider is forwarded directly to Nylas, skipping its picker screen.
3. Or use **Invite by Email** to send a recruiter a self-service connect
   link.
4. Use the **HeartPulse** icon to verify the connection is healthy.

## 6. Provider behavior

| Provider | Conferencing | Email invite |
|---|---|---|
| Google | Google Meet (auto) | Sent by Google |
| Microsoft 365 / Exchange | Microsoft Teams (auto) | Sent by Outlook |
| iCloud | None | Sent by iCloud |

The `driver_email` is added as a participant on the event so calendar
clients send their native invite. Apply AI **also** sends a branded
confirmation email with a `.ics` attachment (driver) plus a recruiter
notification.

## 7. Reminder timing

Queued automatically when a callback is booked:

- `driver_1h` — SMS via Twilio (`send-sms`) + email with join link, ~60 min
  before start.
- `recruiter_15m` — email with driver details + join link, ~15 min before
  start.

The cron job claims each reminder atomically (status flip from
`pending` → `sent`) so duplicate workers never double-send.

## 8. Verification checklist

- [ ] Run the cron `select cron.schedule(...)` once.
- [ ] Connect at least one Google or Microsoft calendar via the new buttons.
- [ ] Trigger a test booking from an ElevenLabs agent — confirm event
      appears with Meet/Teams link and driver receives invite + Apply AI
      confirmation email.
- [ ] Wait for reminders — confirm rows in `scheduling_reminders` flip
      from `pending` to `sent`.
- [ ] Test `reschedule_callback` and `cancel_callback` from the dashboard
      (icons next to each upcoming row) and via the agent.
