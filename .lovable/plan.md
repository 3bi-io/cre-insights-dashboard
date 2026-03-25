

## Investigation Results: Outbound Call Delays & Jerry Hayes SMS

### Finding 1: Call Timing (Not a Bug — Working as Designed)

The outbound call pipeline has three sequential stages that add up to 11-15 minutes total:

```text
App Submitted → Call Queued (instant, <1ms)
                     ↓
              Cron picks up call (every 2 min)
                     ↓
              ElevenLabs initiates call + conversation runs (1-3 min)
                     ↓
              Reconciliation sync updates status (every 5 min)
                     ↓
              Total: ~11-15 minutes from submission to completed_at
```

Data from the last 7 days confirms this is consistent — all during-hours first-attempt calls show 10-15 minute end-to-end times. After-hours calls correctly defer to next business hours (e.g., Marquis Love: applied 11:41pm, called back at 12:15pm next day).

**To reduce delay**, the cron frequency could be increased from `*/2` to `*/1` (every minute), and the sync reconciliation from `*/5` to `*/3`. This would shave ~3-4 minutes off the total.

### Finding 2: Jerry Hayes Did Not Miss the Call

Jerry Hayes's most recent call (today, 3/25 at 15:58 UTC) shows:
- **Status**: `completed` (not `no_answer`)
- **Duration**: 51 seconds
- **Call SID**: `CA22b281a97abab55cb3b9d41fd0bb905c`

The AI agent connected and had a 51-second conversation. This is why no SMS was sent — the SMS verification follow-up only triggers on `no_answer` status for the first attempt. If Jerry's voicemail answered instead of Jerry himself, the system would still register it as `completed` because ElevenLabs marks any answered call (including voicemail) as completed.

### Finding 3: Root Cause of "No SMS After No Answer"

The SMS follow-up code has a **correct but narrow trigger condition**:

1. Call status must be `no_answer` (not `completed`, `failed`, or `busy`)
2. `retry_count` must be `0` (first attempt only)
3. `consent_to_sms` must be `'yes'`
4. Application must not be already enriched

For Jerry today, condition #1 failed — the call was `completed`, not `no_answer`. Additionally, Jerry's `consent_to_sms` is `NULL` (not `'yes'`), which means even if the call had been `no_answer`, the SMS would have been blocked by condition #3.

### Recommended Fixes

1. **Voicemail detection gap**: Short-duration "completed" calls (under 15-20 seconds) likely hit voicemail. Add logic to reclassify completed calls with `duration_seconds < 15` as `no_answer` during reconciliation, triggering the SMS follow-up flow.

2. **Consent field gap**: The short application form does not appear to set `consent_to_sms = 'yes'` — it remains `NULL`. The SMS condition checks for `=== 'yes'`, so `NULL` blocks all SMS. Fix: treat `NULL` consent as implicit consent (since they submitted a phone number), or update the application submission to default `consent_to_sms` to `'yes'`.

3. **Reduce cron intervals** (optional): Change `process-outbound-call-queue` from `*/2` to `*/1` and `sync-stuck-outbound-calls` from `*/5` to `*/3` to reduce total delay by ~3-4 minutes.

### Technical Details

| Component | Current | Proposed |
|-----------|---------|----------|
| Queue cron | Every 2 min | Every 1 min |
| Sync cron | Every 5 min | Every 3 min |
| Voicemail threshold | None | `duration < 15s` → reclassify as `no_answer` |
| SMS consent check | `=== 'yes'` only | `!== 'no'` (allow NULL) |
| Files to change | `elevenlabs-outbound-call/index.ts` (reconciliation logic, SMS consent check) |
| DB migration | Update cron schedules, default `consent_to_sms` on applications |

