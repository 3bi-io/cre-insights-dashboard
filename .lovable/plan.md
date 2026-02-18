

# Remove Business Hours Gating -- Always Call Immediately

## Summary

Currently, outbound calls created outside business hours (before 9 AM or after 4:30 PM CST, Mon-Fri) are set to `scheduled` status and delayed until the next business morning. This change removes that gating so calls always go out immediately. The ElevenLabs agent's prompt (configured in their web UI) will handle after-hours behavior -- asking for a preferred callback time and attempting to connect with a recruiter.

## Changes

### 1. Update Database Trigger Function

Replace `trigger_application_insert_outbound_call()` to always set status to `queued` (never `scheduled`). Remove all references to `is_within_business_hours()`, `get_next_business_hours_start()`, and `scheduled_at` logic.

The key change in every insert block:
- Before: Check business hours, conditionally set `queued` or `scheduled`
- After: Always set `queued`, `scheduled_at = NULL`

### 2. Add `is_after_hours` Dynamic Variable to Edge Function

In `supabase/functions/elevenlabs-outbound-call/index.ts`, add a new dynamic variable `is_after_hours` to the `buildDynamicVariables` function. This computes whether the current time is outside 9:00 AM - 4:30 PM Central Time (Mon-Fri) and passes `"yes"` or `"no"` to ElevenLabs so the agent prompt can branch its behavior.

Also add `current_time_cst` so the agent knows the exact time for context.

### 3. ElevenLabs Agent Prompt Update (Manual -- Outside Code)

After deploying, you will need to update each outbound agent's system prompt in the ElevenLabs web UI to include after-hours logic using the new `{{is_after_hours}}` dynamic variable. Example prompt addition:

> If `{{is_after_hours}}` is "yes": Let the applicant know you're calling about their application. Mention that your recruiting team is currently unavailable but will be available tomorrow morning after 9 AM Central Time. Ask the applicant: "What time in the morning works best for a recruiter to call you back?" Collect their preferred callback time and confirm it. If `{{is_after_hours}}` is "no": Proceed with the normal screening flow and attempt to connect them with a recruiter.

## Technical Details

### Database Migration (SQL)

```sql
CREATE OR REPLACE FUNCTION public.trigger_application_insert_outbound_call()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id UUID;
  v_client_id UUID;
  v_voice_agent_id UUID;
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND length(NEW.phone) >= 10 THEN

    -- PRIORITY 0: Embed Form submissions
    IF NEW.source = 'Embed Form' THEN
      SELECT id INTO v_voice_agent_id
      FROM voice_agents
      WHERE agent_id = 'agent_3201kfp75kshfgwr1kfs310715z3'
        AND is_outbound_enabled = true
        AND agent_phone_number_id IS NOT NULL
        AND is_active = true
      LIMIT 1;

      IF v_voice_agent_id IS NOT NULL THEN
        INSERT INTO outbound_calls (
          application_id, voice_agent_id, organization_id,
          phone_number, status, scheduled_at, metadata
        ) VALUES (
          NEW.id, v_voice_agent_id, NULL,
          NEW.phone, 'queued', NULL,
          jsonb_build_object(
            'applicant_name', COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''),
            'triggered_by', 'embed_form_submission',
            'source', 'Embed Form'
          )
        );
        RETURN NEW;
      END IF;
    END IF;

    -- Get org and client from job listing
    SELECT jl.organization_id, jl.client_id INTO v_org_id, v_client_id
    FROM job_listings jl WHERE jl.id = NEW.job_listing_id;

    -- PRIORITY 1: Client-specific agent
    IF v_client_id IS NOT NULL THEN
      SELECT id INTO v_voice_agent_id
      FROM voice_agents
      WHERE organization_id = v_org_id AND client_id = v_client_id
        AND is_outbound_enabled = true AND agent_phone_number_id IS NOT NULL AND is_active = true
      LIMIT 1;
    END IF;

    -- PRIORITY 2: Org-level agent
    IF v_voice_agent_id IS NULL AND v_org_id IS NOT NULL THEN
      SELECT id INTO v_voice_agent_id
      FROM voice_agents
      WHERE organization_id = v_org_id AND client_id IS NULL
        AND is_outbound_enabled = true AND agent_phone_number_id IS NOT NULL AND is_active = true
      LIMIT 1;
    END IF;

    -- PRIORITY 3: Platform default
    IF v_voice_agent_id IS NULL THEN
      SELECT id INTO v_voice_agent_id
      FROM voice_agents
      WHERE is_platform_default = true
        AND is_outbound_enabled = true AND agent_phone_number_id IS NOT NULL AND is_active = true
      LIMIT 1;
    END IF;

    -- Always queue immediately
    IF v_voice_agent_id IS NOT NULL THEN
      INSERT INTO outbound_calls (
        application_id, voice_agent_id, organization_id,
        phone_number, status, scheduled_at, metadata
      ) VALUES (
        NEW.id, v_voice_agent_id, v_org_id,
        NEW.phone, 'queued', NULL,
        jsonb_build_object(
          'applicant_name', COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''),
          'triggered_by', 'application_submission',
          'source', COALESCE(NEW.source, 'unknown'),
          'client_id', v_client_id
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
```

### Edge Function Change (`buildDynamicVariables`)

Add after the existing variables:

```typescript
// After-hours detection (CST = UTC-6, CDT = UTC-5)
const nowUtc = new Date();
const cstOffset = -6; // Use -5 during CDT if needed
const nowCst = new Date(nowUtc.getTime() + cstOffset * 60 * 60 * 1000);
const hour = nowCst.getHours();
const minute = nowCst.getMinutes();
const dayOfWeek = nowCst.getDay(); // 0=Sun, 6=Sat
const timeInMinutes = hour * 60 + minute;
const isBusinessDay = dayOfWeek >= 1 && dayOfWeek <= 5;
const isBusinessHours = isBusinessDay && timeInMinutes >= 540 && timeInMinutes < 990;
// 540 = 9:00 AM, 990 = 4:30 PM

vars.is_after_hours = isBusinessHours ? 'no' : 'yes';
vars.current_time_cst = nowCst.toLocaleTimeString('en-US', {
  hour: 'numeric', minute: '2-digit', hour12: true
});
```

## Post-Deployment Action Required

After this deploys, update each outbound agent's system prompt in the **ElevenLabs dashboard** to use the `{{is_after_hours}}` variable for after-hours callback scheduling behavior.

