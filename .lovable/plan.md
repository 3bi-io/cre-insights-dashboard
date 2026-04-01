
Goal: keep the “Screen now” first call behavior, but stop the AI from transferring to a recruiter at night/holidays. Instead, it should screen the driver and schedule the next valid business-day callback.

What I found
1. Primary bug: the after-hours callback is explicitly labeled as a recruiter transfer when calendars exist.
   - In `supabase/functions/elevenlabs-outbound-call/index.ts`, the scheduled callback metadata sets:
   - `callback_purpose: hasCalendarConnections ? 'recruiter_transfer' : 'business_hours_callback'`
   - That means any after-hours callback for orgs with calendar connections is tagged as `recruiter_transfer`, which likely tells the voice agent to hand off instead of schedule.

2. Holiday context is incomplete.
   - The code exposes `vars.is_holiday` to the agent, but I only found it being read, not set for outbound call metadata.
   - Result: the agent may know it is after-hours, but not reliably know it is a holiday case.

3. Business-hours context is only loaded from org-level settings in one place.
   - `elevenlabs-outbound-call` loads `organization_call_settings` with `client_id IS NULL`, so client-level schedule overrides may be ignored when building the agent context.

4. The scheduling backend itself looks mostly correct.
   - `next_business_datetime(...)` already respects business days and holidays.
   - `agent-scheduling` already has a no-calendar fallback that schedules next business time.
   - The main issue is the outbound call metadata/context telling the agent “transfer” instead of “schedule.”

Implementation plan
1. Fix the after-hours callback intent in `elevenlabs-outbound-call`
   - Replace `callback_purpose: 'recruiter_transfer'` with a scheduling-focused value for after-hours callbacks, regardless of calendar connections.
   - Use one consistent purpose such as `business_hours_callback` or `scheduled_callback`.
   - Keep calendar awareness separately via `_has_calendar_connections` so the agent can still use scheduling tools without attempting live transfer.

2. Pass explicit after-hours/holiday instructions into dynamic variables
   - Set metadata flags like:
     - `_is_holiday`
     - `_is_after_hours`
     - `_after_hours_action = 'schedule_next_business_day'`
     - `_allow_live_transfer = 'no'`
   - Surface them in `buildDynamicVariables()` so the agent gets an unambiguous instruction set.

3. Respect client-level schedule settings when building call context
   - Update the settings lookup in `elevenlabs-outbound-call` to try client-specific `organization_call_settings` first, then fall back to org-level.
   - This keeps the agent’s “current hours” logic aligned with the same rules used by `next_business_datetime()`.

4. Align scheduling behavior for holiday cases
   - Ensure first-call screening can still occur after-hours/holiday, but any follow-up callback created from that call is always scheduled via `next_business_datetime(...)`.
   - No “transfer now” branch should remain for after-hours/holiday callbacks.

5. Add/adjust tests
   - Add targeted tests for:
     - after-hours + calendar connections => callback metadata is scheduling-focused, not recruiter transfer
     - holiday first call => callback scheduled to next business window
     - client-level business-hours override => dynamic variables use client settings
   - This prevents regression.

6. Review agent prompt/tool behavior
   - Because the actual conversation script likely lives in the ElevenLabs dashboard, I would also verify the prompt/tool instructions for any logic tied to:
     - `callback_purpose`
     - `is_after_hours_callback`
     - `has_calendar_connections`
   - If the prompt currently says “transfer when calendars exist,” it should be updated to:
     - after-hours/holiday: schedule for next business day
     - business hours: transfer or offer live recruiter options if desired

Files likely involved
- `supabase/functions/elevenlabs-outbound-call/index.ts`
- `supabase/functions/agent-scheduling/index.ts`
- `supabase/functions/agent-scheduling/index.test.ts`
- Possibly ElevenLabs dashboard prompt/tool configuration (outside repo)

Expected outcome
- New applications after hours still get screened immediately.
- The AI no longer tries to transfer to a recruiter at night or on holidays.
- Follow-up action becomes: schedule next valid business-day callback, using recruiter calendars when available, or fallback scheduling when not.

Technical details
- Root-cause line: `callback_purpose: hasCalendarConnections ? 'recruiter_transfer' : 'business_hours_callback'`
- Correct design: calendar availability should affect how the callback is scheduled, not whether the AI attempts a live recruiter transfer after hours.
- `next_business_datetime()` already handles business-day + holiday skipping, so the cleanest fix is to correct metadata and agent context rather than redesign scheduling logic.
