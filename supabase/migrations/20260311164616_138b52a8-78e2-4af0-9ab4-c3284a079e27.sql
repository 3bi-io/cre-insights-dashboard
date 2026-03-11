
-- ============================================================
-- 1. Add new follow-up rule columns to organization_call_settings
-- ============================================================
ALTER TABLE public.organization_call_settings
  ADD COLUMN IF NOT EXISTS follow_up_on_no_answer boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS follow_up_on_failed boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS follow_up_on_busy boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS follow_up_delay_minutes integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS follow_up_escalation_multiplier numeric(3,1) NOT NULL DEFAULT 2.0,
  ADD COLUMN IF NOT EXISTS cooldown_hours integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS callback_reference_enabled boolean NOT NULL DEFAULT true;

-- ============================================================
-- 2. Update the upsert RPC to handle new columns
-- ============================================================
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
  p_callback_reference_enabled boolean DEFAULT NULL
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
    callback_reference_enabled, updated_at
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
    updated_at = now()
  RETURNING * INTO v_result;

  RETURN to_jsonb(v_result);
END;
$function$;

-- ============================================================
-- 3. Drop the duplicate follow-up trigger (edge function handles retries)
-- ============================================================
DROP TRIGGER IF EXISTS on_outbound_call_status_change ON public.outbound_calls;

-- Replace the function with a no-op to preserve it if referenced
CREATE OR REPLACE FUNCTION public.trigger_follow_up_outbound_call()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Follow-up logic is now handled by the edge function sync path
  -- to prevent duplicate retry calls. This trigger is intentionally a no-op.
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trigger_follow_up_outbound_call() IS 
'No-op: follow-up retries are now consolidated in the elevenlabs-outbound-call edge function sync path to prevent duplicate calls.';
