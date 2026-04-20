

## Plan: Admiral Merchants — Reverse the Call Window

### Goal
For client `53d7dd20…` (Admiral Merchants), AI agent should:
1. **NEVER call new applicants during business hours.** First attempt happens only **after-hours, weekends, or holidays**.
2. **If first contact happened nights/weekends/holidays**, schedule a **next-business-day follow-up** that confirms info and attempts live transfer.

This is the inverse of the platform's default "Screen Immediately" behavior. Normal clients are unaffected.

### How the system works today (relevant)
- `trigger_application_insert_outbound_call()` queues an outbound_call with status `queued` immediately on every application insert.
- Queue processor (`elevenlabs-outbound-call` `process_queue` branch) **bypasses business-hours gating for first attempts** (`retry_count = 0`) and only enforces business-hours on retries.
- After a first call completes after-hours, agent-scheduling already inserts an `is_after_hours_callback: true` follow-up scheduled for the next business-day morning. When that follow-up runs (retry_count ≥ 1, in business hours), `allow_live_transfer` is `'yes'` automatically.

So the after-hours callback path already does step 2 exactly as requested. The only thing to build is **suppressing the immediate first attempt for Admiral when it lands during business hours**, and **deferring it to that evening's after-hours window** instead.

### Change 1 — DB trigger: defer Admiral first attempt outside business hours

Update `public.trigger_application_insert_outbound_call()`. After resolving `v_client_id` and before the insert, add an Admiral-specific branch:

```sql
IF v_client_id = '53d7dd20-d743-4d34-93e9-eb7175c39da1' THEN
  -- Admiral: only call outside business hours.
  -- If currently in business hours, defer to today's BH end (or next holiday/weekend window).
  IF is_within_business_hours(v_org_id, v_client_id) THEN
    v_scheduled_at := get_admiral_after_hours_start(v_org_id, v_client_id);
    v_status := 'scheduled';
  ELSE
    v_scheduled_at := NULL;     -- queue immediately, we're already after hours
    v_status := 'queued';
  END IF;
ELSE
  v_scheduled_at := NULL;
  v_status := 'queued';
END IF;
```

Then use `v_status` / `v_scheduled_at` in the INSERT and add `'admiral_after_hours_only': true` to metadata so it's audit-visible.

Add a small helper `get_admiral_after_hours_start(org, client)`:
- Reads the client's `business_hours_end` + `business_hours_timezone` + `business_days` from `organization_call_settings` (client row, falling back to org).
- If today is a business day and now < end → returns today at `business_hours_end + 1 minute` local, converted to UTC.
- Otherwise → returns `now()` (we're already after-hours; queue immediately).
- Skip holidays with `organization_holidays` lookup so the call still goes out (holidays = allowed).

### Change 2 — Queue processor: respect Admiral's reverse gate on first attempts

In `supabase/functions/elevenlabs-outbound-call/index.ts` inside the `process_queue` per-call loop (around line 770–791), the existing branch is:

```ts
if (!isFirstAttempt) { /* gate retries by business hours */ }
else { /* first attempt bypasses — log */ }
```

Add an Admiral exception:

```ts
const clientIdMeta = (callMeta.metadata as any)?.client_id;
const isAdmiral = clientIdMeta === '53d7dd20-d743-4d34-93e9-eb7175c39da1';

if (isFirstAttempt && isAdmiral) {
  const { data: withinHours } = await supabase.rpc('is_within_business_hours', {
    p_org_id: orgId, p_client_id: clientIdMeta,
  });
  if (withinHours === true) {
    // Belt-and-suspenders: trigger should already have scheduled this for after-hours,
    // but if a row slipped through (e.g., manual requeue), reschedule it.
    await supabase.from('outbound_calls')
      .update({ status: 'scheduled', scheduled_at: /* today's BH end */, updated_at: new Date().toISOString() })
      .eq('id', call.id);
    results.results.push({ call_id: call.id, status: 'skipped', error: 'Admiral: deferred to after-hours' });
    continue;
  }
}
```

Holidays are already handled — the existing holiday gate skips calls. We need to **invert that for Admiral**: holidays should be allowed (per user request: "after hours and holidays"). Add an Admiral bypass to the org-holiday check (line ~764):

```ts
if (orgHoliday && !isAdmiral) { /* skip */ }
```

(The global-holiday check at line 635 currently kills the entire batch. Change it to only mark non-Admiral calls skipped — or simpler: when a global holiday is detected, still process calls whose client is Admiral.)

### Change 3 — Agent prompt context (no code change needed)
The follow-up callback that fires next business day will naturally have `retry_count ≥ 1` and run during business hours, so `allow_live_transfer = 'yes'` and `callback_purpose = 'business_hours_callback'` are already set correctly. The Admiral outbound agent's existing prompt handles "confirm information then transfer" via the standard live-transfer tool — no prompt edits required. (If user later wants stronger language, that's an ElevenLabs dashboard edit, not code.)

### Files touched
- **New migration**: update `trigger_application_insert_outbound_call()` + add `get_admiral_after_hours_start()` helper.
- `supabase/functions/elevenlabs-outbound-call/index.ts`: add Admiral first-attempt business-hours defer + holiday bypass in the `process_queue` branch.

### What does NOT change
- All other clients (Hayes, Danny Herman, Pemberton, Aspen, CR England, etc.) keep "Screen Immediately" behavior.
- ZipRecruiter / CDL Job Cast gates already in the trigger remain in place (Admiral check runs after them).
- Inbound Admiral agent — untouched.
- Retry / max_attempts / cooldown logic — untouched.

### Verification
1. Submit a test application for an Admiral job at, say, 11:00 AM CT → expect `outbound_calls` row with `status='scheduled'`, `scheduled_at` ≈ 4:31 PM CT today, `metadata.admiral_after_hours_only = true`. No call placed until evening.
2. Submit a test application at 8:00 PM CT → row goes `status='queued'` immediately and call fires within ~1 minute.
3. Submit at 10:00 AM Saturday → call fires immediately (weekend = outside business days).
4. Submit on a federal holiday at 10:00 AM → call fires immediately (holiday bypass for Admiral).
5. After an after-hours first call completes, confirm the existing agent-scheduling logic creates the next-business-day callback with `allow_live_transfer = yes`.

