

## Improvements While Nylas URI Is Pending

Since the Nylas OAuth redirect URI needs manual fixing in the Nylas Dashboard and Supabase secrets, here are the improvements we can make to the scheduling system and broader app right now — none of these depend on Nylas being connected.

---

### 1. Fix the Calendar Integration Upsert Logic

The `calendar-integration` edge function uses `onConflict: 'user_id,provider'` for upsert (line 235), but the unique constraint was changed to a functional index including `client_id`. This means upserts will fail silently, and the fallback insert may create duplicates. We need to fix this to use a proper insert-or-update pattern that respects the new `(user_id, provider, client_id)` constraint.

### 2. Add Client Association to Recruiter Self-Service Calendar Page

The recruiter page (`RecruiterCalendarPage.tsx`) currently connects calendars without any client association — `handleConnect` calls `oauth_url` without passing `client_id`. We should add a client selector so recruiters can choose which client they're connecting a calendar for, matching the admin UI pattern.

### 3. Improve Scheduled Callbacks Dashboard with Client Context

The `ScheduledCallbacksDashboard` doesn't show which client a callback is associated with. We should join through `application_id → job_listing → client` to display the client name on each callback card.

### 4. Add Multi-Recruiter Round-Robin in Agent Scheduling

Currently `agent-scheduling` just picks `connections[0]` (line 175). When multiple recruiters have calendars connected for a client, we should check availability across all of them and pick the one with the earliest available slot, enabling true round-robin scheduling.

### 5. Add Connection Health Status Check

Add a "Test Connection" button on calendar connection cards that pings the Nylas API to verify the grant is still valid. This helps admins diagnose issues before the AI agent encounters them during a live call.

---

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/calendar-integration/index.ts` | Fix upsert logic for new unique constraint |
| `supabase/functions/agent-scheduling/index.ts` | Implement multi-recruiter availability check across all connections |
| `src/pages/RecruiterCalendarPage.tsx` | Add client selector for calendar connections |
| `src/components/voice/ScheduledCallbacksDashboard.tsx` | Show client name on callback cards |
| `src/components/voice/RecruiterCalendarConnect.tsx` | Add "Test Connection" health check button |

### Estimated Scope
5 files modified, no new migrations needed. All changes are functional improvements to existing code that will work immediately — the Nylas OAuth fix is only needed for the initial connect flow.

