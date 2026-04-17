

## Plan: Skip AI Calls for CDL Job Cast Leads (Except ZipRecruiter Sub-Source)

### Goal
Stop the AI agent from calling applicants whose `source = 'CDL Job Cast'`, **unless** the lead originated from ZipRecruiter (identified by `utm_source` or `utm_medium` containing "zip", case-insensitive).

### Change — single DB migration

Update the `public.trigger_application_insert_outbound_call()` trigger function to add a CDL Job Cast gate **before** Priority 1 (after the Embed Form block, before the org/client agent lookup):

```sql
IF NEW.source = 'CDL Job Cast' THEN
  IF NOT (
    COALESCE(NEW.utm_source, '') ILIKE '%zip%'
    OR COALESCE(NEW.utm_medium, '') ILIKE '%zip%'
  ) THEN
    -- CDL Job Cast lead without ZipRecruiter attribution → no AI call
    RETURN NEW;
  END IF;
END IF;
```

ZipRecruiter-attributed CDL Job Cast leads fall through and continue to the existing Priority 1/2 agent assignment logic exactly as today.

### Why this works
- `applications.utm_source` and `applications.utm_medium` are already populated by both `inbound-applications` and `cdl-jobcast-inbound` edge functions (confirmed in code).
- `NEW.source = 'CDL Job Cast'` is enforced upstream by `SOURCE_ORGANIZATION_OVERRIDES` and the cdl-jobcast-inbound forwarder.
- Trigger runs `BEFORE/AFTER INSERT` on `applications` — no row is created in `outbound_calls`, so no call queues, no retries, no SMS follow-ups for blocked leads.
- ZipRecruiter direct webhook leads (`source = 'ZipRecruiter'`) are unaffected — they only hit this gate if source is literally CDL Job Cast.

### What does NOT change
- ZipRecruiter direct integrations (`ziprecruiter-webhook`) — unaffected.
- Embed Form flow — unaffected (handled before the gate).
- All other sources (Indeed, Direct Application, Hayes Website, etc.) — unaffected.
- ATS delivery, webhooks, status lifecycle — unaffected. The application is still created and routed; only the AI call is suppressed.

### Verification after migration
1. Submit a test CDL Job Cast application without `utm_source=zip*` → application created, **no row** in `outbound_calls`.
2. Submit a test CDL Job Cast application with `utm_source=ziprecruiter` → application created, outbound_call row queued as today.
3. Existing direct ZipRecruiter webhook submissions → still queue calls.

