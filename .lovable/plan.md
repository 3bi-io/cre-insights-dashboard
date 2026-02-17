

# Fix Outbound Call Pipeline -- 3 Critical Issues

## Issue 1: Duplicate Trigger Creating Double Calls

Every application submission fires TWO triggers that both call the same function, creating duplicate outbound call records for every applicant.

**Triggers on `applications` table:**
- `on_application_insert_queue_outbound_call` --> `trigger_application_insert_outbound_call()`
- `trigger_new_application_outbound_call` --> `trigger_application_insert_outbound_call()`

**Fix:** Drop the duplicate trigger via SQL migration:
```sql
DROP TRIGGER IF EXISTS trigger_new_application_outbound_call ON applications;
```

---

## Issue 2: Scheduled Calls Stuck with NULL `scheduled_at`

8 calls are in `scheduled` status but have `scheduled_at = NULL`. The cron job promotion query uses `.lte('scheduled_at', now())`, which never matches NULL. These calls will never be processed.

**Fix (two parts):**

**A. Repair existing stuck calls** -- immediately promote them to `queued` since it's now business hours (Tuesday, Central Time):
```sql
UPDATE outbound_calls 
SET status = 'queued', updated_at = NOW()
WHERE status = 'scheduled' AND scheduled_at IS NULL;
```

**B. Add a NOT NULL default + fallback in the promotion query** -- update the edge function to also promote calls where `scheduled_at IS NULL` as a safety net:
```typescript
// In the process_queue section, add a second promotion for NULL scheduled_at
const { data: promotedNull } = await supabase
  .from('outbound_calls')
  .update({ status: 'queued', updated_at: new Date().toISOString() })
  .eq('status', 'scheduled')
  .is('scheduled_at', null)
  .select('id');
```

**C. Add `organization_call_settings` row** for Hayes Recruiting so future `get_next_business_hours_start()` calls return a proper timestamp:
```sql
INSERT INTO organization_call_settings (organization_id)
VALUES ('84214b48-7b51-45bc-ad7f-723bcf50466c')
ON CONFLICT DO NOTHING;
```

---

## Issue 3: James Burg Agent Missing ElevenLabs Agent ID

The "Outbound Agent - James Burg Trucking" voice agent has no `elevenlabs_agent_id`, so the ElevenLabs API call fails when it tries to use this agent.

**Fix:** You will need to provide the ElevenLabs agent ID for James Burg. Once provided, the update is:
```sql
UPDATE voice_agents 
SET elevenlabs_agent_id = '<AGENT_ID_HERE>'
WHERE id = '23981299-ce34-47a3-9646-45bc09dba6f8';
```

If no dedicated James Burg ElevenLabs agent exists yet, the agent row should be deactivated to prevent broken calls:
```sql
UPDATE voice_agents 
SET is_active = false 
WHERE id = '23981299-ce34-47a3-9646-45bc09dba6f8' 
AND elevenlabs_agent_id IS NULL;
```

---

## Issue 4: Deduplicate Existing Double Records

Clean up the existing duplicate outbound call records created by the double trigger. For each application, keep one call and cancel the duplicate:

```sql
WITH duplicates AS (
  SELECT id, application_id,
    ROW_NUMBER() OVER (PARTITION BY application_id, status ORDER BY created_at) as rn
  FROM outbound_calls
  WHERE status IN ('scheduled', 'queued')
)
UPDATE outbound_calls 
SET status = 'cancelled', updated_at = NOW()
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
```

---

## Summary of Changes

| Change | Type | Impact |
|--------|------|--------|
| Drop duplicate trigger | SQL migration | Prevents future double calls |
| Promote stuck scheduled calls | SQL query | Unblocks 8 pending calls |
| Add NULL scheduled_at safety net | Edge function code | Prevents future stuck calls |
| Add org call settings row | SQL query | Ensures proper scheduling timestamps |
| Fix or deactivate James Burg agent | SQL query (needs your input) | Prevents failed calls to James Burg applicants |
| Deduplicate existing records | SQL query | Cleans up historical duplicates |

## Technical Details

- The edge function at `supabase/functions/elevenlabs-outbound-call/index.ts` lines 170-181 handles scheduled-to-queued promotion, but only for non-NULL `scheduled_at`
- The DB trigger function `trigger_application_insert_outbound_call` correctly calls `get_next_business_hours_start()`, but with no row in `organization_call_settings`, the SELECT INTO may silently fail
- The cron job (#3) fires every minute and is confirmed working
- No frontend code changes needed -- this is entirely backend/database fixes

