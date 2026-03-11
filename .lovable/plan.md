

## After-Hours Call Strategy: Screen Immediately, Callback During Business Hours

### Current Behavior
The business hours gate (lines 518-528) blocks ALL calls outside business hours. The agent already has `is_after_hours` and `business_hours_note` dynamic variables telling it not to transfer to a recruiter after hours — but the call never fires because the gate prevents it.

### New Behavior
1. **First-attempt calls always go through** — no business hours gate. When someone applies at 10pm, call them immediately. The agent already knows it's after hours and won't attempt recruiter transfer.
2. **After-hours first calls auto-schedule ONE callback** for the next business day during business hours. This callback is specifically for recruiter transfer.
3. **Follow-up/retry calls remain gated** — they only fire during business hours (existing behavior stays for retries).

### Changes

#### 1. Edge Function — Queue processor gate (lines 488-528)
Modify the per-call business hours check: if the call's `retry_count = 0` (first attempt), skip the business hours gate and let it through. Only gate calls where `retry_count > 0`.

#### 2. Edge Function — Auto-schedule next-day callback after after-hours calls
After a successful first-attempt call that was placed outside business hours, automatically insert a new `scheduled` call for the next business day morning. This call will have metadata like `{ is_after_hours_callback: true, callback_purpose: "recruiter_transfer" }` so the agent knows to offer the transfer.

Logic location: after the call record is updated to `initiated` (line 1028-1038), check if it's outside business hours + first attempt → insert a scheduled callback using `next_business_datetime` RPC.

#### 3. Dynamic variables — Add callback context
Add `is_after_hours_callback` variable so the ElevenLabs agent can say "Hi [name], we spoke last night about the [job] position — let me connect you with a recruiter now."

#### 4. Edge Function — Cap after-hours callbacks to one
Before scheduling the callback, check if one already exists for this application with `is_after_hours_callback: true` in metadata. If so, skip creating a duplicate.

#### 5. UI — No changes needed
The existing smart scheduling toggles and business hours settings already cover this. The `business_hours_note` dynamic variable already instructs the agent correctly for after-hours behavior.

### Summary

| File | Change |
|------|--------|
| `supabase/functions/elevenlabs-outbound-call/index.ts` | Skip biz-hours gate for first attempts; auto-schedule next-day callback after after-hours calls; add `is_after_hours_callback` dynamic var |

No DB migration needed — uses existing `metadata` jsonb and `next_business_datetime` RPC.

