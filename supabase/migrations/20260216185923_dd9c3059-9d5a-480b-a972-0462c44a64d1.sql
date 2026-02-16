
-- Helper function to calculate next business hours start
CREATE OR REPLACE FUNCTION public.get_next_business_hours_start(
  p_org_id UUID DEFAULT NULL
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tz TEXT := 'America/Chicago';
  v_start TIME := '09:00:00';
  v_end TIME := '16:30:00';
  v_days INTEGER[] := '{1,2,3,4,5}';
  v_now_local TIMESTAMP;
  v_today_dow INTEGER;
  v_candidate DATE;
  v_i INTEGER;
BEGIN
  -- Load org-specific settings if available
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
  v_today_dow := EXTRACT(ISODOW FROM v_now_local)::INTEGER; -- 1=Mon, 7=Sun

  -- Check if currently within business hours
  IF v_today_dow = ANY(v_days) 
     AND v_now_local::TIME >= v_start 
     AND v_now_local::TIME < v_end THEN
    RETURN NOW(); -- We're in business hours right now
  END IF;

  -- If today is a business day and before start time, return today's start
  IF v_today_dow = ANY(v_days) AND v_now_local::TIME < v_start THEN
    RETURN (v_now_local::DATE || ' ' || v_start::TEXT)::TIMESTAMP AT TIME ZONE v_tz;
  END IF;

  -- Find the next business day (check up to 7 days ahead)
  FOR v_i IN 1..7 LOOP
    v_candidate := (v_now_local::DATE + v_i);
    IF EXTRACT(ISODOW FROM v_candidate)::INTEGER = ANY(v_days) THEN
      RETURN (v_candidate || ' ' || v_start::TEXT)::TIMESTAMP AT TIME ZONE v_tz;
    END IF;
  END LOOP;

  -- Fallback: next day at start time
  RETURN ((v_now_local::DATE + 1) || ' ' || v_start::TEXT)::TIMESTAMP AT TIME ZONE v_tz;
END;
$$;

-- Helper to check if we're currently in business hours
CREATE OR REPLACE FUNCTION public.is_within_business_hours(
  p_org_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  RETURN v_today_dow = ANY(v_days) 
     AND v_now_local::TIME >= v_start 
     AND v_now_local::TIME < v_end;
END;
$$;

-- Update the application insert trigger to gate on business hours
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
  v_call_status TEXT;
  v_scheduled_at TIMESTAMPTZ;
BEGIN
  -- Only proceed if phone number exists and is valid
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
        -- Business hours gating (no org for embed forms)
        IF is_within_business_hours(NULL) THEN
          v_call_status := 'queued';
          v_scheduled_at := NULL;
        ELSE
          v_call_status := 'scheduled';
          v_scheduled_at := get_next_business_hours_start(NULL);
        END IF;

        INSERT INTO outbound_calls (
          application_id,
          voice_agent_id,
          organization_id,
          phone_number,
          status,
          scheduled_at,
          metadata
        ) VALUES (
          NEW.id,
          v_voice_agent_id,
          NULL,
          NEW.phone,
          v_call_status,
          v_scheduled_at,
          jsonb_build_object(
            'applicant_name', COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''),
            'triggered_by', 'embed_form_submission',
            'source', 'Embed Form',
            'business_hours_gated', v_call_status = 'scheduled'
          )
        );
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
    
    -- PRIORITY 3: Platform default fallback
    IF v_voice_agent_id IS NULL THEN
      SELECT id INTO v_voice_agent_id
      FROM voice_agents
      WHERE is_platform_default = true
        AND is_outbound_enabled = true
        AND agent_phone_number_id IS NOT NULL
        AND is_active = true
      LIMIT 1;
    END IF;
    
    -- Create outbound call with business hours gating
    IF v_voice_agent_id IS NOT NULL THEN
      IF is_within_business_hours(v_org_id) THEN
        v_call_status := 'queued';
        v_scheduled_at := NULL;
      ELSE
        v_call_status := 'scheduled';
        v_scheduled_at := get_next_business_hours_start(v_org_id);
      END IF;

      INSERT INTO outbound_calls (
        application_id,
        voice_agent_id,
        organization_id,
        phone_number,
        status,
        scheduled_at,
        metadata
      ) VALUES (
        NEW.id,
        v_voice_agent_id,
        v_org_id,
        NEW.phone,
        v_call_status,
        v_scheduled_at,
        jsonb_build_object(
          'applicant_name', COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''),
          'triggered_by', 'application_submission',
          'source', COALESCE(NEW.source, 'unknown'),
          'client_id', v_client_id,
          'business_hours_gated', v_call_status = 'scheduled'
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update the follow-up trigger with business hours gating
CREATE OR REPLACE FUNCTION public.trigger_follow_up_outbound_call()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id UUID;
  v_client_id UUID;
  v_voice_agent_id UUID;
  v_follow_up_config RECORD;
  v_attempt_count INT;
  v_raw_scheduled_at TIMESTAMPTZ;
  v_final_scheduled_at TIMESTAMPTZ;
  v_next_bh TIMESTAMPTZ;
BEGIN
  -- Only proceed if status changed to a follow-up triggering status
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('no_answer', 'busy', 'failed') THEN
    -- Get organization ID AND client ID
    SELECT jl.organization_id, jl.client_id INTO v_org_id, v_client_id
    FROM applications a
    JOIN job_listings jl ON jl.id = a.job_listing_id
    WHERE a.id = NEW.application_id;
    
    -- Check organization follow-up settings
    SELECT * INTO v_follow_up_config
    FROM organization_call_settings
    WHERE organization_id = v_org_id;
    
    -- Default follow-up behavior if no config exists
    IF v_follow_up_config IS NULL OR v_follow_up_config.auto_follow_up_enabled = true THEN
      -- Count existing call attempts for this application
      SELECT COUNT(*) INTO v_attempt_count
      FROM outbound_calls
      WHERE application_id = NEW.application_id;
      
      -- Check max attempts (default 3)
      IF v_attempt_count < COALESCE(v_follow_up_config.max_attempts, 3) THEN
        -- Prefer client-specific agent first
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
        
        -- Fall back to org-level agent if no client match
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
        
        -- Final fallback to platform default
        IF v_voice_agent_id IS NULL THEN
          SELECT id INTO v_voice_agent_id
          FROM voice_agents
          WHERE is_platform_default = true
            AND is_outbound_enabled = true
            AND agent_phone_number_id IS NOT NULL
            AND is_active = true
          LIMIT 1;
        END IF;
        
        -- Schedule follow-up call with business hours gating
        IF v_voice_agent_id IS NOT NULL THEN
          -- Calculate raw scheduled time based on delay
          v_raw_scheduled_at := NOW() + INTERVAL '1 hour' * COALESCE(v_follow_up_config.follow_up_delay_hours, 4);
          
          -- Ensure the scheduled time falls within business hours
          -- We temporarily check if the raw time is within business hours
          -- If not, push to next business hours window
          v_next_bh := get_next_business_hours_start(v_org_id);
          IF v_raw_scheduled_at < v_next_bh THEN
            v_final_scheduled_at := v_next_bh;
          ELSE
            -- The raw time is after next BH start; check if it's still within that day's window
            -- For simplicity, if it lands outside hours it gets pushed to next BH
            DECLARE
              v_tz TEXT := COALESCE(v_follow_up_config.business_hours_timezone, 'America/Chicago');
              v_end TIME := COALESCE(v_follow_up_config.business_hours_end, '16:30:00');
              v_days INTEGER[] := COALESCE(v_follow_up_config.business_days, '{1,2,3,4,5}');
              v_raw_local TIMESTAMP;
              v_raw_dow INTEGER;
            BEGIN
              v_raw_local := (v_raw_scheduled_at AT TIME ZONE v_tz);
              v_raw_dow := EXTRACT(ISODOW FROM v_raw_local)::INTEGER;
              
              IF v_raw_dow = ANY(v_days) AND v_raw_local::TIME < v_end THEN
                v_final_scheduled_at := v_raw_scheduled_at;
              ELSE
                -- Push to next business day start
                v_final_scheduled_at := get_next_business_hours_start(v_org_id);
                -- If next BH start is before raw time (same moment edge case), add delay from start
                IF v_final_scheduled_at <= NOW() THEN
                  v_final_scheduled_at := get_next_business_hours_start(v_org_id);
                END IF;
              END IF;
            END;
          END IF;

          INSERT INTO outbound_calls (
            application_id,
            voice_agent_id,
            organization_id,
            phone_number,
            status,
            scheduled_at,
            metadata
          ) VALUES (
            NEW.application_id,
            v_voice_agent_id,
            v_org_id,
            NEW.phone_number,
            'scheduled',
            v_final_scheduled_at,
            jsonb_build_object(
              'triggered_by', 'follow_up',
              'previous_call_id', NEW.id,
              'previous_status', NEW.status,
              'attempt_number', v_attempt_count + 1,
              'client_id', v_client_id,
              'business_hours_gated', true
            )
          );
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;
