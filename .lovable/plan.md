

# Fix AI Scheduling After-Hours & Weekend Transfer Logic

## Issues Identified

After reviewing all the code, I found **3 bugs** preventing correct after-hours/weekend scheduling behavior:

### Bug 1: After-hours `business_hours_note` ignores calendar availability
**File**: `supabase/functions/elevenlabs-outbound-call/index.ts` (line 1482-1483)

When `is_after_hours = 'yes'`, the agent always gets told "Do NOT attempt to transfer to a recruiter" — even when the org HAS calendar connections. The agent should instead be told to use the scheduling tools to book a callback on the recruiter's next open slot.

**Current** (line 1482-1483):
```text
Currently outside business hours... Do NOT attempt to transfer. Let the candidate know a recruiter will call them back during business hours.
```

**Fix**: Split the after-hours message based on `hasCalendar`:
- **Has calendar**: "Currently outside business hours. Do NOT transfer live, but you CAN use the scheduling tools (check_availability / book_callback) to schedule a callback on the recruiter's next available slot."
- **No calendar**: Keep existing message (recruiter will call back next business day).

### Bug 2: After-hours callback always uses `business_hours_callback` purpose (no calendar-aware scheduling)
**File**: `supabase/functions/elevenlabs-outbound-call/index.ts` (lines 1289-1292)

When `hasCalendarConnections = true`, the callback_purpose is set to `'recruiter_transfer'` — but the scheduled callback call still fires at a generic next-business-day morning time with jitter, rather than checking the recruiter's actual calendar availability. The callback should use the agent-scheduling function to find the recruiter's next open slot when calendars exist.

**Fix**: When `hasCalendarConnections = true`, instead of scheduling at `next_business_datetime + jitter`, call the `calendar-integration` function's `get_availability` to find the actual next open slot and schedule at that time. This ensures the callback aligns with when the recruiter is actually free.

### Bug 3: `check_availability` no-calendar fallback hardcodes timezone display
**File**: `supabase/functions/agent-scheduling/index.ts` (line 255)

The no-calendar fallback always formats the callback time in `America/Chicago`, regardless of the org's configured timezone. Minor but causes confusion.

**Fix**: Fetch the org's `business_hours_timezone` from `organization_call_settings` and use it for display.

## Implementation Plan

### Step 1: Fix after-hours `business_hours_note` for calendar-aware orgs
In `buildDynamicVariables()`, update the `else` branch (after-hours) to check `hasCalendar`:
- If `hasCalendar === 'yes'`: Tell the agent to use scheduling tools to book on the recruiter's next available slot, NOT to transfer live
- If `hasCalendar !== 'yes'`: Keep existing behavior (recruiter will call back)

### Step 2: Fix after-hours callback to use real calendar availability
In the after-hours callback scheduling block (~line 1248-1318):
- When `hasCalendarConnections = true`, call `calendar-integration` with `get_availability` for the next business day window to find the actual next open slot
- Schedule the callback at that slot time instead of generic `next_business_datetime + jitter`
- Fall back to current jitter logic if calendar query fails

### Step 3: Fix timezone display in no-calendar fallback
In `agent-scheduling/index.ts` (~line 254), fetch `business_hours_timezone` from `organization_call_settings` for the org and use it instead of hardcoded `America/Chicago`.

## Files Changed
- **Modified**: `supabase/functions/elevenlabs-outbound-call/index.ts` — Fix business_hours_note after-hours branch + calendar-aware callback scheduling
- **Modified**: `supabase/functions/agent-scheduling/index.ts` — Fix hardcoded timezone in no-calendar fallback

