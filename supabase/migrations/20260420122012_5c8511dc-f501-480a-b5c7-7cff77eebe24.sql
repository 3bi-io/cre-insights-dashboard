
-- Helper: compute Admiral after-hours start (today's BH end + 1 min, or now if already after-hours/weekend/holiday)
CREATE OR REPLACE FUNCTION public.get_admiral_after_hours_start(p_org_id uuid, p_client_id uuid)
RETURNS timestamp with time zone
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tz TEXT := 'America/Chicago';
  v_end TIME := '16:30:00';
  v_days INTEGER[] := '{1,2,3,4,5}';
  v_now_local TIMESTAMP;
  v_today_dow INTEGER;
  v_today_local_date DATE;
  v_is_holiday BOOLEAN;
  v_found BOOLEAN := false;
BEGIN
  -- Try client-specific call settings first, then org-level
  IF p_client_id IS NOT NULL THEN
    SELECT
      COALESCE(business_hours_timezone, 'America/Chicago'),
      COALESCE(business_hours_end, '16:30:00'),
      COALESCE(business_days, '{1,2,3,4,5}')
    INTO v_tz, v_end, v_days
    FROM organization_call_settings
    WHERE organization_id = p_org_id AND client_id = p_client_id;
    v_found := FOUND;
  END IF;

  IF NOT v_found AND p_org_id IS NOT NULL THEN
    SELECT
      COALESCE(business_hours_timezone, 'America/Chicago'),
      COALESCE(business_hours_end, '16:30:00'),
      COALESCE(business_days, '{1,2,3,4,5}')
    INTO v_tz, v_end, v_days
    FROM organization_call_settings
    WHERE organization_id = p_org_id AND client_id IS NULL;
  END IF;

  v_now_local := (NOW() AT TIME ZONE v_tz);
  v_today_local_date := v_now_local::DATE;
  v_today_dow := EXTRACT(ISODOW FROM v_now_local)::INTEGER;

  -- Holiday today? Admiral is allowed to call → return now
  SELECT EXISTS (
    SELECT 1 FROM public.organization_holidays
    WHERE holiday_date = v_today_local_date
      AND (organization_id = p_org_id OR organization_id IS NULL)
  ) INTO v_is_holiday;

  IF v_is_holiday THEN
    RETURN NOW();
  END IF;

  -- Weekend / non-business day → call now (already after-hours)
  IF NOT (v_today_dow = ANY(v_days)) THEN
    RETURN NOW();
  END IF;

  -- Business day: if past business hours end, call now; else schedule for end + 1 min
  IF v_now_local::TIME >= v_end THEN
    RETURN NOW();
  END IF;

  RETURN ((v_today_local_date::TEXT || ' ' || (v_end + INTERVAL '1 minute')::TIME::TEXT)::TIMESTAMP) AT TIME ZONE v_tz;
END;
$function$;

-- Update the application insert trigger to defer Admiral first attempts to after-hours
CREATE OR REPLACE FUNCTION public.trigger_application_insert_outbound_call()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_org_id UUID;
  v_client_id UUID;
  v_voice_agent_id UUID;
  v_status TEXT := 'queued';
  v_scheduled_at TIMESTAMPTZ := NULL;
  v_admiral_after_hours_only BOOLEAN := false;
  ADMIRAL_CLIENT_ID CONSTANT UUID := '53d7dd20-d743-4d34-93e9-eb7175c39da1';
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND length(NEW.phone) >= 10 THEN

    -- PRIORITY 0: Embed Form submissions get dedicated agent
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
          application_id, voice_agent_id, organization_id, phone_number,
          status, scheduled_at, metadata
        ) VALUES (
          NEW.id, v_voice_agent_id, NULL, NEW.phone, 'queued', NULL,
          jsonb_build_object(
            'applicant_name', COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''),
            'triggered_by', 'embed_form_submission',
            'source', 'Embed Form',
            'business_hours_gated', false
          )
        );
        RETURN NEW;
      END IF;
    END IF;

    -- GATE: Skip CDL Job Cast leads UNLESS they originated from ZipRecruiter
    IF NEW.source = 'CDL Job Cast' THEN
      IF NOT (
        COALESCE(NEW.utm_source, '') ILIKE '%zip%'
        OR COALESCE(NEW.utm_medium, '') ILIKE '%zip%'
      ) THEN
        RETURN NEW;
      END IF;
    END IF;

    -- Get organization ID AND client ID from job listing
    SELECT jl.organization_id, jl.client_id INTO v_org_id, v_client_id
    FROM job_listings jl
    WHERE jl.id = NEW.job_listing_id;

    -- PRIORITY 1: Client-specific agent
    IF v_client_id IS NOT NULL THEN
      SELECT id INTO v_voice_agent_id
      FROM voice_agents
      WHERE organization_id = v_org_id
        AND client_id = v_client_id
        AND is_outbound_enabled = true
        AND agent_phone_number_id IS NOT NULL
        AND is_active = true
      LIMIT 1;
    END IF;

    -- PRIORITY 2: Org-level agent (client_id IS NULL)
    IF v_voice_agent_id IS NULL AND v_org_id IS NOT NULL THEN
      SELECT id INTO v_voice_agent_id
      FROM voice_agents
      WHERE organization_id = v_org_id
        AND client_id IS NULL
        AND is_outbound_enabled = true
        AND agent_phone_number_id IS NOT NULL
        AND is_active = true
      LIMIT 1;
    END IF;

    -- ADMIRAL MERCHANTS: Reverse window — only call after-hours/weekends/holidays.
    -- If currently within business hours, defer to today's after-hours window.
    IF v_client_id = ADMIRAL_CLIENT_ID THEN
      v_admiral_after_hours_only := true;
      IF is_within_business_hours(v_org_id, v_client_id) THEN
        v_status := 'scheduled';
        v_scheduled_at := get_admiral_after_hours_start(v_org_id, v_client_id);
      ELSE
        v_status := 'queued';
        v_scheduled_at := NULL;
      END IF;
    END IF;

    -- Queue call
    IF v_voice_agent_id IS NOT NULL THEN
      INSERT INTO outbound_calls (
        application_id, voice_agent_id, organization_id, phone_number,
        status, scheduled_at, metadata
      ) VALUES (
        NEW.id, v_voice_agent_id, v_org_id, NEW.phone, v_status, v_scheduled_at,
        jsonb_build_object(
          'applicant_name', COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''),
          'triggered_by', 'application_submission',
          'source', COALESCE(NEW.source, 'unknown'),
          'client_id', v_client_id,
          'business_hours_gated', false,
          'is_within_business_hours', is_within_business_hours(v_org_id, v_client_id),
          'admiral_after_hours_only', v_admiral_after_hours_only
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
