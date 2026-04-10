

# Fix: Scheduled Callbacks Not Appearing for Danny Herman

## Root Cause

The `scheduled_callbacks` table has **zero real records** after the seed data from March. The insert in `agent-scheduling/index.ts` (line 238-249) silently fails every time because:

1. **`recruiter_user_id` is NOT NULL** but the no-calendar fallback path never provides one (there's no recruiter assigned).
2. **`client_id` column doesn't exist** on the table -- the insert passes `client_id` which causes a column error.
3. **`source` column doesn't exist** -- should be `booking_source`.

Meanwhile, the `elevenlabs-outbound-call` after-hours callback path only creates `outbound_calls` records and never writes to `scheduled_callbacks` at all.

So every after-hours callback (like Jose Casanova's voicemail-then-callback-this-morning for Danny Herman) is tracked in `outbound_calls` but invisible in the client portal's Scheduled Callbacks section.

## Fix Plan

### 1. Migration: Make `recruiter_user_id` nullable
The no-calendar fallback has no recruiter to assign, so this column must be nullable.

```sql
ALTER TABLE scheduled_callbacks ALTER COLUMN recruiter_user_id DROP NOT NULL;
```

### 2. Fix `agent-scheduling/index.ts` insert (line 238-249)
Correct the column names:
- `source` -> `booking_source`
- Remove `client_id` (not a column on the table)
- Add `driver_name` and `driver_phone` from the application data

### 3. Add `scheduled_callbacks` insert to `elevenlabs-outbound-call`
When the outbound call system schedules an after-hours callback (the `after_hours_auto_callback` path), also insert a `scheduled_callbacks` record so it appears in the client dashboard. This mirrors what `agent-scheduling` does but from the automatic follow-up path.

### 4. Update `ScheduledCallbacksSection` query
The component currently joins through `applications -> job_listings` to find callbacks by client. Since `scheduled_callbacks` doesn't have `client_id` as a column, the current join path is correct. But we should also consider showing outbound_calls with `is_after_hours_callback` metadata as a fallback view, in case the insert still fails for edge cases.

## Files Changed
- **Migration**: Make `recruiter_user_id` nullable on `scheduled_callbacks`
- **`supabase/functions/agent-scheduling/index.ts`**: Fix column names in the insert
- **`supabase/functions/elevenlabs-outbound-call/index.ts`**: Add `scheduled_callbacks` insert when scheduling after-hours callbacks

