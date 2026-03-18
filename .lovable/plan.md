

# Fix: Agent Scheduling Timezone Bug & After-Hours Callback Logic

## Problem Analysis

### 1. No "failed" or "initiated" calls today
The database shows **zero** calls with `failed` or `initiated` status in the last 7 days. The sync reconciliation is working correctly. What appears as "failed" in the UI are likely `no_answer` calls (10 of 14 calls in last 24h = 71% no-answer rate). This is a contact rate issue, not a system failure.

### 2. Agent scheduling not scheduling calls after hours (the real bug)
In `agent-scheduling/index.ts` `handleCheckAvailability()`, **all date/time math is done in UTC but uses local-hour recruiter preferences**, causing completely wrong slot calculations at night.

**Lines 299-312 — the broken code:**
```typescript
// BUG: compares UTC hour to local-hour workEnd
if (!allowSameDay || now.getUTCHours() >= workEnd) {
  candidate.setDate(candidate.getDate() + 1);
}
// BUG: sets hours in UTC, not in recruiter's timezone
startTime.setHours(workStart, 0, 0, 0);  
endTime.setHours(workEnd, 0, 0, 0);
```

**Example**: At 10 PM EDT (2 AM UTC), with `workEnd = 17` (5 PM):
- `getUTCHours()` = 2, so `2 >= 17` is **false** → doesn't advance to next day
- Then `setHours(8, 0, 0, 0)` sets 8 AM **UTC** (4 AM EDT) as the start
- Calendar integration receives a window of 4 AM - 5 PM UTC, which is nonsensical
- Returns zero slots → agent tells the driver "all recruiters are fully booked"

The org's actual settings: timezone `America/New_York`, business hours `08:00-17:00`.

### 3. `get_next_slots` hardcodes timezone
Line 541: `handleGetNextSlots` hardcodes `driver_timezone: 'America/Chicago'` instead of passing through the actual driver/org timezone.

## Solution

### Fix `handleCheckAvailability` — timezone-aware slot generation

Replace the broken UTC-based date math with proper timezone-aware calculations:

1. **Convert "now" to recruiter's local time** before comparing against work hours
2. **Use the recruiter's timezone** to construct proper UTC start/end times for calendar queries
3. **Use `Intl.DateTimeFormat`** with the recruiter's timezone to get correct local hour/day

```typescript
// Convert current time to recruiter's local perspective
const nowLocal = new Date(now.toLocaleString('en-US', { timeZone: recruiterTz }));
const localHour = nowLocal.getHours();
const localMinute = nowLocal.getMinutes();
const localDayOfWeek = nowLocal.getDay() === 0 ? 7 : nowLocal.getDay();

// Determine if we need to look at next day
const isPastWorkEnd = localHour > workEnd || (localHour === workEnd && localMinute > 0);
const isBeforeWorkStart = localHour < workStart;

let candidateDate = new Date(nowLocal);
if (!allowSameDay || isPastWorkEnd) {
  candidateDate.setDate(candidateDate.getDate() + 1);
}

// Find next working day
for (let i = 0; i < 7; i++) {
  const dow = candidateDate.getDay() === 0 ? 7 : candidateDate.getDay();
  if (workingDays.includes(dow)) break;
  candidateDate.setDate(candidateDate.getDate() + 1);
}

// Build local date string (YYYY-MM-DD) and construct UTC equivalents
const dateStr = candidateDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
const startLocal = new Date(`${dateStr}T${String(workStart).padStart(2,'0')}:00:00`);
const endLocal = new Date(`${dateStr}T${String(workEnd).padStart(2,'0')}:00:00`);

// Convert local times to UTC using timezone offset math
function localToUtc(localDate: Date, tz: string): Date {
  const utcStr = localDate.toLocaleString('en-US', { timeZone: 'UTC' });
  const tzStr = localDate.toLocaleString('en-US', { timeZone: tz });
  const diff = new Date(utcStr).getTime() - new Date(tzStr).getTime();
  return new Date(localDate.getTime() + diff);
}

const startTimeUtc = localToUtc(startLocal, recruiterTz);
const endTimeUtc = localToUtc(endLocal, recruiterTz);
const effectiveStart = startTimeUtc > minBookingTime ? startTimeUtc : minBookingTime;
```

### Fix `handleGetNextSlots` — pass through org timezone

Instead of hardcoding `America/Chicago`, pass the params through so the org's actual timezone is used.

### Files to edit
- `supabase/functions/agent-scheduling/index.ts` — Fix timezone math in `handleCheckAvailability` and `handleGetNextSlots`

