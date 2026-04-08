-- Fix Bug 3: Add holiday check to both overloads of is_within_business_hours

CREATE OR REPLACE FUNCTION public.is_within_business_hours(p_org_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tz TEXT := 'America/Chicago';
  v_start TIME := '09:00:00';
  v_end TIME := '16:30:00';
  v_days INTEGER[] := '{1,2,3,4,5}';
  v_now_local TIMESTAMP;
  v_today_dow INTEGER;
BEGIN
  IF p_org_id IS NOT NULL THEN
    SELECT 
      COALESCE(business_hours_timezone, 'America/Chicago'),
      COALESCE(business_hours_start, '09:00:00'),
      COALESCE(business_hours_end, '16:30:00'),
      COALESCE(business_days, '{1,2,3,4,5}')
    INTO v_tz, v_start, v_end, v_days
    FROM organization_call_settings
    WHERE organization_id = p_org_id;
  END IF;

  v_now_local := (NOW() AT TIME ZONE v_tz);
  v_today_dow := EXTRACT(ISODOW FROM v_now_local)::INTEGER;

  -- Check holiday BEFORE business hours
  IF public.is_holiday(p_org_id, v_now_local::DATE) THEN
    RETURN false;
  END IF;

  RETURN v_today_dow = ANY(v_days) 
     AND v_now_local::TIME >= v_start 
     AND v_now_local::TIME < v_end;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_within_business_hours(p_org_id uuid DEFAULT NULL::uuid, p_client_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tz TEXT := 'America/Chicago';
  v_start TIME := '09:00:00';
  v_end TIME := '16:30:00';
  v_days INTEGER[] := '{1,2,3,4,5}';
  v_now_local TIMESTAMP;
  v_today_dow INTEGER;
  v_found BOOLEAN := false;
BEGIN
  IF p_org_id IS NOT NULL THEN
    -- Try client-specific settings first
    IF p_client_id IS NOT NULL THEN
      SELECT 
        COALESCE(business_hours_timezone, 'America/Chicago'),
        COALESCE(business_hours_start, '09:00:00'),
        COALESCE(business_hours_end, '16:30:00'),
        COALESCE(business_days, '{1,2,3,4,5}')
      INTO v_tz, v_start, v_end, v_days
      FROM organization_call_settings
      WHERE organization_id = p_org_id AND client_id = p_client_id;
      
      v_found := FOUND;
    END IF;

    -- Fall back to org-level settings
    IF NOT v_found THEN
      SELECT 
        COALESCE(business_hours_timezone, 'America/Chicago'),
        COALESCE(business_hours_start, '09:00:00'),
        COALESCE(business_hours_end, '16:30:00'),
        COALESCE(business_days, '{1,2,3,4,5}')
      INTO v_tz, v_start, v_end, v_days
      FROM organization_call_settings
      WHERE organization_id = p_org_id AND client_id IS NULL;
    END IF;
  END IF;

  v_now_local := (NOW() AT TIME ZONE v_tz);
  v_today_dow := EXTRACT(ISODOW FROM v_now_local)::INTEGER;

  -- Check holiday BEFORE business hours
  IF public.is_holiday(p_org_id, v_now_local::DATE) THEN
    RETURN false;
  END IF;

  RETURN v_today_dow = ANY(v_days) 
     AND v_now_local::TIME >= v_start 
     AND v_now_local::TIME < v_end;
END;
$function$;