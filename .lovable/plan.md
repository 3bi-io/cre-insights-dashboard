## Current Scheduling Capabilities — Detailed Overview

### Architecture (today)
The voice scheduling flow is **already wired end-to-end through Nylas v3** (a third-party calendar abstraction layer that proxies to Google, Microsoft 365/Exchange, and iCloud). ElevenLabs voice agents call a webhook tool → that tool reads recruiter availability from Nylas → books the slot on the recruiter's real calendar.

```text
ElevenLabs Voice Agent
    │  (webhook tool: check_availability / book_callback / get_next_slots)
    ▼
edge:agent-scheduling                   ← public, no JWT
    │  internal HTTP
    ▼
edge:calendar-integration               ← Nylas v3 wrapper
    │
    ├─→ Nylas Hosted Auth  (Google + Microsoft + iCloud)
    ├─→ Nylas Free/Busy + /calendars/availability
    └─→ Nylas Events API   (creates real calendar event)
    │
    ▼
DB: recruiter_calendar_connections, scheduled_callbacks,
    recruiter_availability_preferences, calendar_invitations
    │
    ▼
edge:morning-digest  → daily HTML email of today's callbacks (via Resend)
```

### What works today
- **Nylas OAuth** for Google, Microsoft (work/school + personal), iCloud — all three providers via one integration. Secrets `NYLAS_API_KEY`, `NYLAS_CLIENT_ID`, `NYLAS_REDIRECT_URI` are configured.
- **Calendar invites by email** — admin sends magic link via Resend; recruiter connects without needing an account first (`calendar_invitations` table, 7-day expiry).
- **Per-recruiter preferences** — working hours, working days, timezone, buffer before/after, default call duration, max daily callbacks, min booking notice, allow same-day, auto-accept.
- **Per-client OR per-org calendar routing** — `recruiter_calendar_connections.client_id` lets one recruiter have a different calendar per client; falls back to org-level connection.
- **Round-robin across recruiters** — picks the recruiter with the earliest free slot.
- **Real Nylas event creation** with title `AI Callback: {driver}`, busy=true, full description.
- **No-calendar fallback** — if no recruiter has a calendar connected, schedules an AI callback during next business window using `next_business_datetime` RPC + creates `outbound_calls` row + records to `scheduled_callbacks`.
- **SMS confirmation** to driver via Twilio.
- **Cancel flow** — deletes Nylas event + marks `scheduled_callbacks.status='cancelled'`.
- **Morning digest** — daily 6am Central email summarizes each recruiter's callbacks.
- **Frontend** — `RecruiterCalendarPage`, `RecruiterCalendarConnect`, `CalendarInviteConnect`, `CalendarCallback`, `ScheduledCallbacksDashboard` already exist.

### Gaps preventing a "complete" scheduling workflow
There are **0 active connections** in `recruiter_calendar_connections` today. The plumbing exists but the production workflow has the following functional gaps that block real bookings:

1. **No booking confirmation email to the driver** — only SMS goes out. No `.ics` invite, no email confirmation, no event invitee added on the calendar event so the driver doesn't get a Google/Outlook invite.
2. **No invitee on the calendar event** — Nylas `events` payload omits `participants`, so the driver doesn't appear as an attendee and gets no native Google/Outlook RSVP.
3. **No reschedule path** — only cancel exists. Voice agent can't move a slot.
4. **No reminder sequence** — there is `digest_email_sent` flag on `scheduled_callbacks` but nothing sends a 1-hour-before reminder to driver or recruiter.
5. **No recruiter notification on booking** — recruiter only sees booking via the calendar event itself + morning digest.
6. **Webhook tools not documented for ElevenLabs config** — agents must be configured by hand in ElevenLabs UI. There is no central reference.
7. **Provider selection at OAuth start** — UI passes `provider` only optionally; default flow opens Nylas's provider chooser. Fine, but we should add explicit "Connect Google" and "Connect Microsoft 365 / Exchange" buttons that pre-select the provider (cleaner UX).
8. **Calendar event missing conferencing link** — no Google Meet / Teams meeting auto-attached, so the call has no join URL on the invite.
9. **No `cancel_callback` and `reschedule_callback` ElevenLabs tools** — only `check_availability`, `book_callback`, `get_next_slots`.
10. **Microsoft Exchange on-prem** — Nylas v3 supports EWS but our redirect URI / scopes need verification; not currently advertised.
11. **No retry on Nylas event creation** — if Nylas momentarily fails, we save the callback as `pending` but never retry creation.

---

## Implementation Plan — Complete the Voice → Calendar Scheduling Workflow

### Scope
Make the existing Nylas-based pipeline production-complete for both **Google Calendar** and **Microsoft Exchange / Office 365**, fully driven by ElevenLabs voice agent tool calls. No swap to a different provider — Nylas already covers both and is configured.

### 1. Database (one migration)
Add columns / table to support reschedule, reminders, driver email, and conferencing.

- `applications` already has `email`. Add to `scheduled_callbacks`:
  - `driver_email text` (copied at booking time so it survives application edits)
  - `reschedule_count int default 0`
  - `reminder_sent_at timestamptz`
  - `conference_url text` (Google Meet / Teams join link)
  - `previous_event_ids text[] default '{}'` (audit trail for reschedules)
- New table `scheduling_reminders` (id, callback_id fk, fire_at timestamptz, kind text check in ('driver_1h','recruiter_15m'), status text default 'pending', sent_at timestamptz). Indexed on `(status, fire_at)` for the cron poller.

### 2. Edge function changes

**`calendar-integration` (extend existing actions, add new)**
- `book_slot`: include the driver as a `participants[]` entry on the Nylas event (so they get a Google/Outlook RSVP), and request `conferencing: { provider: 'Google Meet' | 'Microsoft Teams' }` based on the recruiter's `provider_type`. Capture `conference_url` from response.
- New action `reschedule_slot`: deletes old Nylas event, creates new one, increments counters, returns new times.
- `book_slot`: persist `driver_email` if available from application lookup.
- Add explicit `provider=google` and `provider=microsoft` query-param helpers in `oauth_url` action (we already pass provider through; add lightweight UI buttons — see §4).
- Add a one-shot retry on Nylas event creation when the first attempt fails.

**`agent-scheduling` (new ElevenLabs tools)**
- `reschedule_callback` — takes `callback_id` + `new_slot_start` (+ optional `new_slot_end`), validates ownership, calls `calendar-integration:reschedule_slot`.
- `cancel_callback` — takes `callback_id`, calls `calendar-integration:cancel_booking`. (Currently the voice agent has no tool for this.)
- `get_my_callback` — driver looks up their own scheduled callback by `application_id` (so the agent can confirm "you're booked for X").

**New edge function `scheduling-reminders` (cron-driven, every 5 min)**
- Polls `scheduling_reminders` where `status='pending' and fire_at <= now()`.
- For `driver_1h`: send SMS via existing `send-sms` + branded confirmation email (via Resend) including the `conference_url` and a calendar `.ics` re-attach.
- For `recruiter_15m`: send Resend email to recruiter w/ driver name, phone, application link, conference URL.
- Reuse `_shared/email-config.ts` sender + `_shared/twilio-client.ts`.
- Schedule with `pg_cron` → `net.http_post` every 5 minutes (one SQL insert via the migration tool, kept out of versioned migrations per project standard).

**`book_slot` post-success hook**
- Insert two `scheduling_reminders` rows: `driver_1h` at `scheduled_start - 1h`, `recruiter_15m` at `scheduled_start - 15m`.
- Send immediate confirmation email to driver with `.ics` attachment + Meet/Teams link.
- Send immediate Resend email to recruiter ("New AI booking — {driver} at {time}").

### 3. ElevenLabs agent tool config (documentation deliverable)
Add `docs/ELEVENLABS_SCHEDULING_TOOLS.md` with copy-pasteable JSON for each of these webhook tools to be created in the ElevenLabs agent UI:
- `check_availability`, `get_next_slots`, `book_callback`, `reschedule_callback`, `cancel_callback`, `get_my_callback`.
Each entry lists: webhook URL (`https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/agent-scheduling`), method POST, body schema, expected `result` text the agent reads back, and dynamic variable mapping (`organization_id`, `client_id`, `application_id`, `driver_phone`, `driver_name` from the conversation metadata we already pass per `mem://features/voice-agent-session-attribution`).

### 4. Frontend changes
- `RecruiterCalendarConnect.tsx`: replace the single "Connect Calendar" button with **two explicit buttons** — "Connect Google Calendar" and "Connect Microsoft 365 / Outlook" — each calls `oauth_url` with `provider=google` or `provider=microsoft`. Keep "Other (iCloud / EWS)" as a tertiary link.
- `ScheduledCallbacksDashboard.tsx`: add a **Reschedule** button (opens a date/time picker that calls `agent-scheduling:reschedule_callback` from the recruiter side) and surface `conference_url` as a clickable Meet/Teams link. Show reminder send status.
- New small badge column "Provider" (Google / Microsoft / iCloud) sourced from `recruiter_calendar_connections.provider_type`.

### 5. Microsoft Exchange / Office 365 enablement checklist (no code, just config)
The user (workspace admin) must do these one-time steps in Nylas dashboard. Plan output will include them in a written checklist:
- Enable **Microsoft Graph** integration in Nylas dashboard → Provider Apps.
- Add `https://applyai.jobs/calendar/callback` (matches `NYLAS_REDIRECT_URI`) to the Microsoft Azure App Registration.
- Required Graph scopes: `Calendars.ReadWrite`, `OnlineMeetings.ReadWrite`, `User.Read`, `offline_access` — already what Nylas requests, but verify in Nylas dashboard.
- For on-prem **Exchange (EWS)**: enable EWS provider in Nylas, no extra app registration needed.
- For Google: enable Google provider in Nylas; Google Cloud OAuth consent must list `applyai.jobs` as authorized domain.

### 6. Testing
- Unit tests in `supabase/functions/agent-scheduling/index.test.ts` for the three new tool actions (mock the calendar-integration call).
- One real-world manual test plan in the deliverables section.

### Files touched (high level)
- `supabase/functions/calendar-integration/index.ts` — extend `book_slot`, `cancel_booking`, add `reschedule_slot`.
- `supabase/functions/agent-scheduling/index.ts` — add `reschedule_callback`, `cancel_callback`, `get_my_callback`.
- `supabase/functions/scheduling-reminders/index.ts` — new file.
- `supabase/functions/_shared/ics.ts` — new tiny helper to build `.ics` attachment for confirmations.
- `supabase/config.toml` — register `scheduling-reminders` with `verify_jwt = false` (cron-callable).
- `src/components/voice/RecruiterCalendarConnect.tsx` — two-button provider selector.
- `src/components/voice/ScheduledCallbacksDashboard.tsx` — reschedule + conferencing link.
- `docs/ELEVENLABS_SCHEDULING_TOOLS.md` — new reference doc.
- DB migration (one) for the columns/table above.
- One pg_cron insert (run through the supabase insert tool, not as a versioned migration, per platform standards).

### Out of scope
- Replacing Nylas with raw Google/Microsoft Graph SDKs (Nylas already abstracts both correctly and is the documented architecture per `mem://scheduling/calendar-integration-architecture-v2`).
- Two-way sync of recruiter-created events back into `scheduled_callbacks` (we only manage AI-booked events).
- Group/round-robin pool changes — current per-client + per-org routing stays as-is.

### Acceptance criteria
1. A recruiter can click "Connect Google Calendar" or "Connect Microsoft 365" and complete OAuth in under 60 seconds.
2. An ElevenLabs voice agent call to `book_callback` produces: a real event on the recruiter's Google or Outlook calendar, the driver as an invitee, a Google Meet or Teams join URL on the event, an SMS to the driver, an email confirmation to the driver with `.ics`, and an email to the recruiter.
3. The driver receives a 1-hour-before SMS + email reminder; the recruiter receives a 15-min-before email reminder.
4. The voice agent can reschedule and cancel via `reschedule_callback` / `cancel_callback`, and the calendar event updates accordingly.
5. The morning digest continues to list everything correctly.