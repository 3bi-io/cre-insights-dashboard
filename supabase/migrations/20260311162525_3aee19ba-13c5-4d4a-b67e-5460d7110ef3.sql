
CREATE OR REPLACE FUNCTION public.upsert_call_schedule_settings(
  p_organization_id uuid,
  p_client_id uuid DEFAULT NULL,
  p_business_hours_start time DEFAULT NULL,
  p_business_hours_end time DEFAULT NULL,
  p_business_hours_timezone text DEFAULT NULL,
  p_business_days integer[] DEFAULT NULL,
  p_auto_follow_up_enabled boolean DEFAULT NULL,
  p_max_attempts integer DEFAULT NULL,
  p_follow_up_delay_hours integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result RECORD;
BEGIN
  -- Verify caller is admin or super_admin
  IF NOT (
    is_super_admin(auth.uid()) OR
    has_role(auth.uid(), 'admin'::app_role)
  ) THEN
    RAISE EXCEPTION 'Insufficient privileges to update call schedule settings';
  END IF;

  -- Upsert using the functional unique index pattern
  INSERT INTO organization_call_settings (
    organization_id,
    client_id,
    business_hours_start,
    business_hours_end,
    business_hours_timezone,
    business_days,
    auto_follow_up_enabled,
    max_attempts,
    follow_up_delay_hours,
    updated_at
  ) VALUES (
    p_organization_id,
    p_client_id,
    COALESCE(p_business_hours_start, '09:00:00'::time),
    COALESCE(p_business_hours_end, '16:30:00'::time),
    COALESCE(p_business_hours_timezone, 'America/Chicago'),
    COALESCE(p_business_days, '{1,2,3,4,5}'::integer[]),
    COALESCE(p_auto_follow_up_enabled, false),
    COALESCE(p_max_attempts, 3),
    COALESCE(p_follow_up_delay_hours, 24),
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
    updated_at = now()
  RETURNING * INTO v_result;

  RETURN to_jsonb(v_result);
END;
$$;
