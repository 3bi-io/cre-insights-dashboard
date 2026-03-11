

## Holiday Calendar for Outbound Call Gating

### Problem
The system currently checks business hours and business days before placing calls, but has no awareness of US federal holidays. Calls will go out on holidays like Thanksgiving, Christmas, July 4th, etc.

### Approach

**Store holidays in a new `organization_holidays` table** rather than hardcoding them. This allows orgs to customize (e.g., add state-specific holidays or company holidays) and pre-populates with US federal holidays for the current and next year.

#### 1. SQL Migration — New table + seed data + helper function

**Table: `organization_holidays`**
- `id` (uuid, PK)
- `organization_id` (uuid, FK → organizations, nullable — null = global default)
- `holiday_date` (date, NOT NULL)
- `name` (text, NOT NULL)
- `recurring` (boolean, default false — if true, recurs annually on same month/day)
- `created_at`, `updated_at`
- Unique constraint on `(organization_id, holiday_date)`

**Seed US federal holidays** for 2025 and 2026 with `organization_id = NULL` (global defaults):
- New Year's Day, MLK Day, Presidents' Day, Memorial Day, Juneteenth, Independence Day, Labor Day, Columbus Day, Veterans Day, Thanksgiving, Christmas Day

**DB function: `is_holiday(p_org_id uuid, p_date date)`** — SECURITY DEFINER, checks if the given date is a holiday for the org (org-specific first, then global fallback). Returns boolean.

#### 2. Edge Function Updates (`elevenlabs-outbound-call/index.ts`)

**Queue processing path** (line ~330): After promoting scheduled→queued, before processing each call, check if today (in the org's timezone) is a holiday using a query against `organization_holidays`. If it is, skip processing and log "Holiday — skipping calls."

**Sync retry scheduling** (line ~267): When calculating `scheduledAt` for a follow-up, also check if the scheduled date falls on a holiday and push it to the next non-holiday business day.

**Dynamic variables** (line ~1058): Add `is_holiday` variable so the agent knows if it's a holiday (for inbound calls that still come in).

#### 3. UI — Holiday Calendar in `CallScheduleSettings.tsx`

Add a new Card section "Holiday Calendar" between Business Hours and Follow-Up Rules:

- Display a list of upcoming holidays (from the DB) with date and name
- "Add Holiday" button that opens a popover with a date picker + name input
- Delete button on each custom holiday
- Toggle to show/hide past holidays
- Badge showing "X holidays this year"
- Pre-populated global holidays shown with a "Default" badge; org-specific ones with a "Custom" badge

#### 4. Hook Updates (`useCallScheduleSettings.ts`)

Add a separate query for `organization_holidays` and mutations for add/delete. Keep it in the same hook or a small companion hook `useHolidayCalendar`.

#### 5. RPC for Holiday Management

`upsert_organization_holiday(p_org_id, p_date, p_name, p_recurring)` and `delete_organization_holiday(p_org_id, p_holiday_id)` — both SECURITY DEFINER with admin check.

### Files Changed

| File | Change |
|------|--------|
| SQL migration | New table, seed holidays, `is_holiday()` function, CRUD RPCs |
| `supabase/functions/elevenlabs-outbound-call/index.ts` | Holiday gate in queue processing + dynamic vars |
| `src/components/voice/CallScheduleSettings.tsx` | Holiday calendar UI section |
| `src/features/elevenlabs/hooks/useCallScheduleSettings.ts` | Holiday query + mutations |
| `src/integrations/supabase/types.ts` | Auto-updated |

