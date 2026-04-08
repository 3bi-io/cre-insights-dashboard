

# Scheduling & Business Hours — Audit Findings

## Summary
Three bugs allow outbound calls to fire outside scheduled operating hours. Two are timezone-related, one is a logic gap in queue processing.

---

## Bug 1: Per-call holiday check uses UTC date instead of org timezone

**Location**: `elevenlabs-outbound-call/index.ts`, lines 686-693

The queue processor computes `todayDateStr` from `nowUtc.toISOString().split('T')[0]` (line 566) and reuses it for per-org holiday checks (line 686: `const orgTodayStr = todayDateStr`). This means at 11 PM Central (which is the next UTC day), or before midnight UTC (still previous day in Central), the holiday lookup uses the wrong date.

**Fix**: For each call in the queue loop, compute the date string in the org's configured timezone using `getDateInTimezone()` (which already exists at line 103) with the org's call settings timezone. This matches the pattern already used in single-call processing at line 1094.

---

## Bug 2: First-attempt calls bypass business hours AND holiday gates

**Location**: `elevenlabs-outbound-call/index.ts`, lines 701-720

The queue processor intentionally bypasses business hours for first-attempt calls (`isFirstAttempt` / `retryCount === 0`) — this is correct for the "Screen Immediately" strategy. However, the holiday check (lines 695-699) runs BEFORE the first-attempt bypass logic, so holidays correctly block first attempts. The problem is the **business hours bypass has no holiday awareness**. A first-attempt call on a holiday that falls on a weekday will:
1. Pass the org-specific holiday check (line 695) **only if an org-specific holiday record exists** — but if only a global holiday is present and the global gate (line 575) used the wrong UTC date (Bug 1), the call goes through.

This is an edge case but compounds with Bug 1.

**Fix**: After the first-attempt bypass, still check if the org has a holiday (using the timezone-correct date). The existing single-call path at lines 1094-1118 does this correctly — the queue path should mirror it.

---

## Bug 3: `is_within_business_hours` SQL function ignores holidays

**Location**: Database function `is_within_business_hours(p_org_id, p_client_id)`

This function checks day-of-week and time range only. It does NOT check the `organization_holidays` table. So even when the queue processor calls `is_within_business_hours` for retry calls (line 708), a holiday that falls on a weekday within business hours will return `true`, and the call will proceed.

**Fix**: Add a holiday check to the SQL function body — call the existing `is_holiday(p_org_id, v_now_local::DATE)` function and return `false` when it's a holiday. This also fixes any other callers of this function platform-wide.

---

## Implementation Steps

1. **Fix `is_within_business_hours` SQL function** — Add `AND NOT is_holiday(p_org_id, v_now_local::DATE)` to the return condition in both overloads. This is a single migration file.

2. **Fix queue holiday date to use org timezone** — In the per-call loop (line 686), replace `const orgTodayStr = todayDateStr` with a call to `getDateInTimezone(nowUtc, orgTimezone)` after fetching the org's call settings. Requires fetching `business_hours_timezone` in the same query that already fetches `organization_id` and `metadata`.

3. **Fix global holiday gate date** — Line 566 should also use Central time (the platform default) rather than UTC: `getDateInTimezone(nowUtc, DEFAULT_TIMEZONE)`.

## Impact
- Prevents retry/follow-up calls from firing on holidays during business hours
- Prevents timezone boundary errors (e.g., 11 PM CDT on July 3 being treated as July 4 in UTC)
- All changes are backward-compatible — no schema changes, only function body updates

