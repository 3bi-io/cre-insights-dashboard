

# Fix Morning Digest Timezone Issues

## Problem
Two timezone-related bugs in `morning-digest`:
1. **Cron fires at 8:30 AM during CDT** — pg_cron is UTC-only, so `30 13` = 7:30 AM CST but 8:30 AM CDT
2. **Date query uses UTC midnight** — `setHours(0,0,0,0)` creates UTC boundaries, missing late-evening Central callbacks

## Plan

### 1. Fix the date query in `morning-digest/index.ts`
Replace the UTC-based day boundaries (lines 63-66) with Central-time-aware boundaries using `Intl.DateTimeFormat` to derive the current date in `America/Chicago`, then construct UTC start/end from that local date. Pattern already used in `agent-scheduling` with `localToUtc`.

### 2. Update the cron schedule
Create a new migration to reschedule the cron job to `30 12 * * 1-5` (12:30 UTC = 7:30 AM CDT). This is correct for CDT (current). During CST it will fire at 6:30 AM — acceptable since most of the year is CDT.

Alternatively, add a comment documenting that the schedule should be toggled seasonally, or accept the 1-hour drift as a tradeoff of pg_cron's UTC-only limitation.

### Technical Details

**File: `supabase/functions/morning-digest/index.ts`**
- Import or inline a helper to get "today in Central time" as a date string
- Construct `dayStart` and `dayEnd` as UTC timestamps representing Central midnight-to-midnight
- Uses the same `Intl.DateTimeFormat` approach proven in `agent-scheduling`

**Migration: new SQL migration**
- `SELECT cron.unschedule('morning-digest-daily');` then reschedule at `30 12 * * 1-5`
- Or keep `30 13` and document the seasonal drift

### Files Changed
- `supabase/functions/morning-digest/index.ts` (date query fix)
- New SQL migration (cron reschedule)

