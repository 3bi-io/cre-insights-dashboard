

# Fix: Scheduling Failures, Weekend Transfers, and Call Clustering

## Problems Identified

### 1. All callbacks fire at the exact same second
The `next_business_datetime` DB function returns the precise business hours start time (e.g., 8:00:00 AM ET) for every after-hours callback. Data confirms: **12 calls all scheduled at `2026-03-16 12:00:00+00`** (8:00 AM ET) and **6 calls at 12:30:00**. When the queue processor promotes all of them to "queued" simultaneously, the ElevenLabs API gets hammered and most calls just show "initiated" (never actually connect).

### 2. Agent transfers to recruiter on weekends
The `business_hours_note` dynamic variable correctly tells the agent "Do NOT attempt to transfer to a recruiter." However, after-hours callbacks are tagged `callback_purpose: 'recruiter_transfer'` — this tells the agent its PURPOSE is to transfer. When the agent calls `check_availability` and gets "No recruiters have connected their calendars," it likely attempts a direct transfer as a fallback. The conflicting signals confuse the agent.

### 3. No fallback when calendars aren't connected
The `agent-scheduling` function returns a text message ("No recruiters have connected their calendars yet") but takes **no action**. No callback is scheduled, no record is created. The candidate hears a vague promise that never materializes.

---

## Changes

### A. Stagger callback scheduling times (elevenlabs-outbound-call)

**Where:** After-hours callback scheduling block (~lines 1094-1128)

After computing `callbackAt` from `next_business_datetime`, add a random offset of **2-45 minutes** so callbacks are spread across the morning window instead of all firing at 8:00:00 AM sharp. This prevents the API burst that causes "initiated" calls that never connect.

```
const jitterMinutes = 2 + Math.floor(Math.random() * 43); // 2-45 min spread
const jitteredTime = new Date(new Date(callbackAt).getTime() + jitterMinutes * 60 * 1000);
const finalCallbackAt = jitteredTime.toISOString();
```

Also apply the same jitter to the **retry scheduling** path (~lines 286-316) when `next_business_datetime` returns the exact business start time. The existing time-rotation code already adds some offset, but only within a window calculation — if the window happens to be the first one, the offset can still cluster.

### B. Fix callback_purpose conflicting with business hours note (elevenlabs-outbound-call)

**Where:** `buildDynamicVariables` function (~lines 1314-1317) and after-hours callback scheduling (~lines 1106-1113)

When the callback fires during business hours (which it will after being scheduled for the next business morning), the `is_after_hours` variable will correctly say `'no'` and `business_hours_note` will say "Recruiter transfer is available." This part is correct.

The real problem: callbacks scheduled for a weekend morning won't have calendar-based scheduling. Change the `callback_purpose` from `'recruiter_transfer'` to `'business_hours_callback'` — the agent should screen and schedule, not blindly transfer. Also add a new dynamic variable `has_calendar_connections` that tells the agent whether calendar booking is available, so the agent's prompt can branch correctly.

### C. Add no-calendar fallback to agent-scheduling (agent-scheduling)

**Where:** `handleCheckAvailability` when `connections.length === 0` (~lines 165-172)

Instead of just returning a text message, actually **schedule an outbound callback** during business hours using `next_business_datetime` and **create a `scheduled_callbacks` record** for recruiter visibility in the dashboard.

The function will:
1. Call `next_business_datetime` to find the next valid business slot
2. Add jitter (5-30 minutes from business hours start)
3. Insert an `outbound_calls` row with `status: 'scheduled'` and metadata `{ callback_purpose: 'business_hours_callback', no_calendar_fallback: true }`
4. Insert a `scheduled_callbacks` row so it appears in the recruiter's morning digest and dashboard
5. Return a natural language response to the agent with the scheduled time so the agent can tell the candidate

### D. Add stagger delay to queue processor (elevenlabs-outbound-call)

**Where:** Queue processing loop (~line 557)

Increase the inter-call delay from 500ms to **2000ms + random 0-3000ms** when processing multiple queued calls. This prevents simultaneous ElevenLabs API calls that result in "initiated" status with 0-duration.

```
// Stagger: 2-5 seconds between calls to prevent API congestion
await new Promise(resolve => setTimeout(resolve, 2000 + Math.floor(Math.random() * 3000)));
```

### E. Update dynamic variables for calendar awareness (elevenlabs-outbound-call)

**Where:** `buildDynamicVariables` and `processOutboundCall` 

Before building dynamic variables, check if the org/client has active calendar connections. Pass `has_calendar_connections: 'yes'|'no'` as a dynamic variable so the ElevenLabs agent prompt can decide whether to attempt scheduling or just promise a callback.

Also update `business_hours_note` to include explicit instructions about not transferring when no calendar is set up:
- When `has_calendar_connections = 'no'` AND `is_after_hours = 'yes'`: "Do NOT transfer. Let the candidate know a recruiter will call them back during business hours on the next business day."
- When `has_calendar_connections = 'no'` AND `is_after_hours = 'no'`: "Do NOT transfer. Let the candidate know a recruiter will reach out to them directly."

---

## Files to Change

| File | Change |
|------|--------|
| `supabase/functions/elevenlabs-outbound-call/index.ts` | Add jitter to after-hours callback scheduling, increase queue inter-call delay, add `has_calendar_connections` dynamic variable, change `callback_purpose` to `business_hours_callback`, update `business_hours_note` |
| `supabase/functions/agent-scheduling/index.ts` | Add no-calendar fallback: schedule outbound call + create scheduled_callbacks record when no calendar connections exist |

## Impact

- **Call clustering fix**: Callbacks will spread across a 45-minute window instead of all firing at 8:00:00 AM. Combined with increased inter-call delay, this should eliminate the "initiated but never connected" problem.
- **Weekend transfer fix**: Agent will no longer receive conflicting instructions about recruiter transfer. The `has_calendar_connections` variable gives clear routing guidance.
- **No-calendar fallback**: Candidates will get an actual scheduled callback (AI call during business hours + recruiter dashboard record) instead of a vague promise.

