

## Follow-Up Strategy Review: Gaps and Best Practices

After reviewing the full edge function, settings, and scheduling logic, here are the issues that reduce contact rates and the fixes to address them.

---

### Critical Issues Found

**1. Hardcoded retry cap conflicts with org settings**
`processOutboundCall` has `MAX_RETRY_ATTEMPTS = 3` hardcoded (line 497). This overrides the configurable `max_attempts` from `organization_call_settings`. If an org sets max_attempts to 5, the processing path still rejects after 3.

**2. No business hours gate in queue processing**
The queue processor checks for holidays but never checks if the current time is within the org's business hours. Calls promoted from `scheduled → queued` will fire immediately even at 2am or on weekends. The business hours context is only injected as a *prompt variable* for the agent — it's not a hard gate.

**3. Follow-up scheduling ignores business hours and holidays**
When scheduling a retry (line 270), the code does `Date.now() + delayMinutes * 60 * 1000`. If a call fails at 4:25pm with a 15-minute delay, the retry schedules for 4:40pm — possibly outside business hours. It also doesn't check if the scheduled date falls on a holiday.

**4. No time-of-day rotation across attempts**
Best practice: if attempt 1 was at 9:30am and got no answer, attempt 2 should be at a different time (e.g., 1:30pm or 4:00pm). Currently all retries fire at the same relative offset, catching the person at the same bad time.

**5. Per-org holiday check missing in queue processor**
Only global holidays are checked (line 338-348). Organization-specific holidays are never checked before processing a queued call.

---

### Proposed Fixes

#### 1. Use org max_attempts instead of hardcoded cap
In `processOutboundCall`, fetch the org's `max_attempts` from `organization_call_settings` instead of using `MAX_RETRY_ATTEMPTS = 3`. Fall back to 3 if no settings exist.

#### 2. Add business hours gate to queue processing
Before processing each queued call, fetch the org's business hours settings and check if the current time (in the org's timezone) falls within the configured window. If not, skip the call — it stays queued and will be picked up on the next cron run during business hours.

#### 3. Smart follow-up scheduling
When calculating `scheduledAt` for a retry:
- Check if the resulting time falls outside business hours → push to next business day's start time
- Check if the resulting date is a holiday → push to next non-holiday business day
- Add **time-of-day rotation**: alternate between morning (first third of business hours), midday, and afternoon windows across attempts

#### 4. Per-org holiday check in queue processor
After fetching each queued call's org, check both global and org-specific holidays before processing.

#### 5. Add "preferred call windows" to settings (new columns)
Add to `organization_call_settings`:
- `preferred_call_windows` (jsonb, default `["morning","afternoon"]`) — configurable windows for retry distribution
- This lets the system rotate retry times across windows automatically

#### 6. UI updates
Add a small "Smart Scheduling" section showing:
- Toggle: "Schedule retries during business hours only" (on by default)
- Toggle: "Rotate retry times across different parts of the day"
- Info text explaining the strategy

---

### Summary of Changes

| File | Change |
|------|--------|
| SQL migration | Add `preferred_call_windows` column, update RPC |
| `elevenlabs-outbound-call/index.ts` | Remove hardcoded MAX_RETRY, add business hours gate in queue processing, smart scheduling with time rotation, per-org holiday check |
| `CallScheduleSettings.tsx` | Add smart scheduling toggles |
| `useCallScheduleSettings.ts` | Add new field to hook |

