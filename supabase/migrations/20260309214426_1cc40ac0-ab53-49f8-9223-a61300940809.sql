
-- 1. Add client_id column to organization_call_settings
ALTER TABLE public.organization_call_settings 
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

-- 2. Drop the old unique constraint on organization_id only
ALTER TABLE public.organization_call_settings 
  DROP CONSTRAINT IF EXISTS organization_call_settings_organization_id_key;

-- 3. Create new unique index that handles NULL client_id via COALESCE
CREATE UNIQUE INDEX IF NOT EXISTS uq_org_call_settings_org_client 
  ON public.organization_call_settings (
    organization_id, 
    COALESCE(client_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

-- 4. Update is_within_business_hours to support client-level fallback
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

  RETURN v_today_dow = ANY(v_days) 
     AND v_now_local::TIME >= v_start 
     AND v_now_local::TIME < v_end;
END;
$function$;

-- 5. Update get_next_business_hours_start to support client-level fallback
CREATE OR REPLACE FUNCTION public.get_next_business_hours_start(p_org_id uuid DEFAULT NULL::uuid, p_client_id uuid DEFAULT NULL::uuid)
 RETURNS timestamp with time zone
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
  v_candidate DATE;
  v_i INTEGER;
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

  -- Check if currently within business hours
  IF v_today_dow = ANY(v_days) 
     AND v_now_local::TIME >= v_start 
     AND v_now_local::TIME < v_end THEN
    RETURN NOW();
  END IF;

  -- If today is a business day and before start time
  IF v_today_dow = ANY(v_days) AND v_now_local::TIME < v_start THEN
    RETURN (v_now_local::DATE || ' ' || v_start::TEXT)::TIMESTAMP AT TIME ZONE v_tz;
  END IF;

  -- Find the next business day
  FOR v_i IN 1..7 LOOP
    v_candidate := (v_now_local::DATE + v_i);
    IF EXTRACT(ISODOW FROM v_candidate)::INTEGER = ANY(v_days) THEN
      RETURN (v_candidate || ' ' || v_start::TEXT)::TIMESTAMP AT TIME ZONE v_tz;
    END IF;
  END LOOP;

  RETURN ((v_now_local::DATE + 1) || ' ' || v_start::TEXT)::TIMESTAMP AT TIME ZONE v_tz;
END;
$function$;
