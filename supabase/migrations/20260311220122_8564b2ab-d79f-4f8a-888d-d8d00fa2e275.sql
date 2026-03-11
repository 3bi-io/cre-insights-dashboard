
-- Add smart scheduling columns to organization_call_settings
ALTER TABLE public.organization_call_settings
  ADD COLUMN IF NOT EXISTS smart_scheduling_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS time_rotation_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS preferred_call_windows jsonb NOT NULL DEFAULT '["morning","afternoon"]'::jsonb;

-- Update the upsert RPC with new columns
CREATE OR REPLACE FUNCTION public.upsert_call_schedule_settings(
  p_organization_id uuid,
  p_client_id uuid DEFAULT NULL,
  p_business_hours_start time DEFAULT NULL,
  p_business_hours_end time DEFAULT NULL,
  p_business_hours_timezone text DEFAULT NULL,
  p_business_days integer[] DEFAULT NULL,
  p_auto_follow_up_enabled boolean DEFAULT NULL,
  p_max_attempts integer DEFAULT NULL,
  p_follow_up_delay_hours integer DEFAULT NULL,
  p_follow_up_on_no_answer boolean DEFAULT NULL,
  p_follow_up_on_failed boolean DEFAULT NULL,
  p_follow_up_on_busy boolean DEFAULT NULL,
  p_follow_up_delay_minutes integer DEFAULT NULL,
  p_follow_up_escalation_multiplier numeric DEFAULT NULL,
  p_cooldown_hours integer DEFAULT NULL,
  p_callback_reference_enabled boolean DEFAULT NULL,
  p_smart_scheduling_enabled boolean DEFAULT NULL,
  p_time_rotation_enabled boolean DEFAULT NULL,
  p_preferred_call_windows jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_result RECORD;
BEGIN
  IF NOT (
    is_super_admin(auth.uid()) OR
    has_role(auth.uid(), 'admin'::app_role)
  ) THEN
    RAISE EXCEPTION 'Insufficient privileges to update call schedule settings';
  END IF;

  INSERT INTO organization_call_settings (
    organization_id, client_id,
    business_hours_start, business_hours_end, business_hours_timezone, business_days,
    auto_follow_up_enabled, max_attempts, follow_up_delay_hours,
    follow_up_on_no_answer, follow_up_on_failed, follow_up_on_busy,
    follow_up_delay_minutes, follow_up_escalation_multiplier, cooldown_hours,
    callback_reference_enabled, smart_scheduling_enabled, time_rotation_enabled,
    preferred_call_windows, updated_at
  ) VALUES (
    p_organization_id, p_client_id,
    COALESCE(p_business_hours_start, '09:00:00'::time),
    COALESCE(p_business_hours_end, '16:30:00'::time),
    COALESCE(p_business_hours_timezone, 'America/Chicago'),
    COALESCE(p_business_days, '{1,2,3,4,5}'::integer[]),
    COALESCE(p_auto_follow_up_enabled, false),
    COALESCE(p_max_attempts, 3),
    COALESCE(p_follow_up_delay_hours, 24),
    COALESCE(p_follow_up_on_no_answer, true),
    COALESCE(p_follow_up_on_failed, true),
    COALESCE(p_follow_up_on_busy, true),
    COALESCE(p_follow_up_delay_minutes, 15),
    COALESCE(p_follow_up_escalation_multiplier, 2.0),
    COALESCE(p_cooldown_hours, 24),
    COALESCE(p_callback_reference_enabled, true),
    COALESCE(p_smart_scheduling_enabled, true),
    COALESCE(p_time_rotation_enabled, true),
    COALESCE(p_preferred_call_windows, '["morning","afternoon"]'::jsonb),
    now()
  )
  ON CONFLICT (organization_id, COALESCE(client_id, '00000000-0000-0000-0000-000000000000'::uuid))
  DO UPDATE SET
    business_hours_start = COALESCE(p_business_hours_start, organization_call_settings.business_hours_start),
    business_hours_end = COALESCE(p_business_hours_end, organization_call_settings.business_hours_end),
    business_hours_timezone = COALESCE(p_business_hours_timezone, organization_call_settings.business_hours_timezone),
    business_days = COALESCE(p_business_days, organization_call_settings.business_days),
    auto_follow_up_enabled = COALESCE(p_auto_follow_up_enabled, organization_call_settings.auto_follow_up_enabled),
    max_attempts = COALESCE(p_max_attempts, organization_call_settings.max_attempts),
    follow_up_delay_hours = COALESCE(p_follow_up_delay_hours, organization_call_settings.follow_up_delay_hours),
    follow_up_on_no_answer = COALESCE(p_follow_up_on_no_answer, organization_call_settings.follow_up_on_no_answer),
    follow_up_on_failed = COALESCE(p_follow_up_on_failed, organization_call_settings.follow_up_on_failed),
    follow_up_on_busy = COALESCE(p_follow_up_on_busy, organization_call_settings.follow_up_on_busy),
    follow_up_delay_minutes = COALESCE(p_follow_up_delay_minutes, organization_call_settings.follow_up_delay_minutes),
    follow_up_escalation_multiplier = COALESCE(p_follow_up_escalation_multiplier, organization_call_settings.follow_up_escalation_multiplier),
    cooldown_hours = COALESCE(p_cooldown_hours, organization_call_settings.cooldown_hours),
    callback_reference_enabled = COALESCE(p_callback_reference_enabled, organization_call_settings.callback_reference_enabled),
    smart_scheduling_enabled = COALESCE(p_smart_scheduling_enabled, organization_call_settings.smart_scheduling_enabled),
    time_rotation_enabled = COALESCE(p_time_rotation_enabled, organization_call_settings.time_rotation_enabled),
    preferred_call_windows = COALESCE(p_preferred_call_windows, organization_call_settings.preferred_call_windows),
    updated_at = now()
  RETURNING * INTO v_result;

  RETURN to_jsonb(v_result);
END;
$function$;

-- Create helper function: compute next valid business datetime
-- Returns the next timestamp that falls within business hours, on a business day, and not a holiday
CREATE OR REPLACE FUNCTION public.next_business_datetime(
  p_org_id uuid,
  p_from timestamptz DEFAULT now(),
  p_client_id uuid DEFAULT NULL
)
RETURNS timestamptz
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_tz TEXT := 'America/Chicago';
  v_start TIME := '09:00:00';
  v_end TIME := '16:30:00';
  v_days INTEGER[] := '{1,2,3,4,5}';
  v_local TIMESTAMP;
  v_date DATE;
  v_dow INTEGER;
  v_max_iterations INTEGER := 30; -- safety cap
BEGIN
  -- Fetch org settings (client override first)
  IF p_client_id IS NOT NULL THEN
    SELECT 
      COALESCE(business_hours_timezone, 'America/Chicago'),
      COALESCE(business_hours_start, '09:00:00'),
      COALESCE(business_hours_end, '16:30:00'),
      COALESCE(business_days, '{1,2,3,4,5}')
    INTO v_tz, v_start, v_end, v_days
    FROM organization_call_settings
    WHERE organization_id = p_org_id AND client_id = p_client_id;
    
    IF NOT FOUND THEN
      SELECT 
        COALESCE(business_hours_timezone, 'America/Chicago'),
        COALESCE(business_hours_start, '09:00:00'),
        COALESCE(business_hours_end, '16:30:00'),
        COALESCE(business_days, '{1,2,3,4,5}')
      INTO v_tz, v_start, v_end, v_days
      FROM organization_call_settings
      WHERE organization_id = p_org_id AND client_id IS NULL;
    END IF;
  ELSE
    SELECT 
      COALESCE(business_hours_timezone, 'America/Chicago'),
      COALESCE(business_hours_start, '09:00:00'),
      COALESCE(business_hours_end, '16:30:00'),
      COALESCE(business_days, '{1,2,3,4,5}')
    INTO v_tz, v_start, v_end, v_days
    FROM organization_call_settings
    WHERE organization_id = p_org_id AND client_id IS NULL;
  END IF;

  v_local := (p_from AT TIME ZONE v_tz);
  
  -- If current time is before business hours end today, keep it; otherwise advance to next day start
  IF v_local::TIME >= v_end THEN
    v_local := (v_local::DATE + 1) + v_start;
  ELSIF v_local::TIME < v_start THEN
    v_local := v_local::DATE + v_start;
  END IF;

  -- Now iterate to find the next valid business day that's not a holiday
  FOR i IN 1..v_max_iterations LOOP
    v_date := v_local::DATE;
    v_dow := EXTRACT(ISODOW FROM v_local)::INTEGER;
    
    IF v_dow = ANY(v_days) AND NOT is_holiday(p_org_id, v_date) THEN
      RETURN (v_local::TIMESTAMP AT TIME ZONE v_tz);
    END IF;
    
    -- Advance to next day at business hours start
    v_local := (v_date + 1) + v_start;
  END LOOP;

  -- Fallback: return as-is
  RETURN p_from;
END;
$function$;
