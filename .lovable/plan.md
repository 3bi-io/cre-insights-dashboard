

## Root Cause: Completion Guard Cancels After-Hours Callbacks

The after-hours callbacks **are** being scheduled correctly. The problem is they get **cancelled by the completion guard** before they can execute.

### What's Happening (Timeline)

1. **1:25 AM** — First-attempt call fires (bypasses biz-hours gate ✓). Call completes or gets no_answer.
2. **1:26 AM** — After-hours callback is auto-scheduled for 12:00 PM with `status: 'scheduled'`.
3. **12:00 PM** — Cron fires `process_queue`. Lines 404-409 **promote** the scheduled callback to `status: 'queued'`.
4. **Immediately after** — Lines 431-458 run the **completion guard**, which checks: "does this application already have a completed call?" For the 3 calls where the first attempt was `completed`, the guard cancels the callback with error: `"Cancelled: completed call already exists for this application"`.

So the system works exactly as coded — but the completion guard doesn't know that after-hours callbacks serve a **different purpose** (recruiter transfer), not a duplicate screening.

### The Fix

Exempt after-hours callbacks from the completion guard. In the guard logic (lines 431-458), when building the `toCancel` list, skip any call whose metadata contains `is_after_hours_callback: true`.

### Specific Change

**File:** `supabase/functions/elevenlabs-outbound-call/index.ts` (lines ~449)

Current:
```typescript
const toCancel = queuedForGuard
  .filter(c => completedAppIds.has(c.application_id))
  .map(c => c.id);
```

Change to: also select `metadata` when fetching `queuedForGuard` (line 434), then filter out after-hours callbacks:
```typescript
const toCancel = queuedForGuard
  .filter(c => completedAppIds.has(c.application_id))
  .filter(c => !(c.metadata as any)?.is_after_hours_callback)
  .map(c => c.id);
```

This is a one-line addition. The completion guard will still cancel duplicate screening calls, but will leave after-hours recruiter-transfer callbacks alone.

### Summary

| What | Detail |
|------|--------|
| **Root cause** | Completion guard cancels callbacks because a completed call already exists for the same application |
| **Evidence** | All 3 cancelled callbacks have error: `"Cancelled: completed call already exists for this application"` |
| **Fix** | Add `.filter(c => !(c.metadata as any)?.is_after_hours_callback)` to the guard's cancel list |
| **File** | `supabase/functions/elevenlabs-outbound-call/index.ts` |
| **Impact** | 1 line change + 1 line change to select metadata in the guard query |

