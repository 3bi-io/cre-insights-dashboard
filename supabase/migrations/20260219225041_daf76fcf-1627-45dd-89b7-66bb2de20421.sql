
-- Update the trigger function to ALWAYS queue calls immediately (no business hours gating)
-- The ElevenLabs agent will handle after-hours logic via dynamic variables
CREATE OR REPLACE FUNCTION public.trigger_application_insert_outbound_call()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_client_id UUID;
  v_voice_agent_id UUID;
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
          'queued',
          NULL,
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
    
    -- Always queue immediately - agent handles after-hours logic via dynamic variables
    IF v_voice_agent_id IS NOT NULL THEN
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
        'queued',
        NULL,
        jsonb_build_object(
          'applicant_name', COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''),
          'triggered_by', 'application_submission',
          'source', COALESCE(NEW.source, 'unknown'),
          'client_id', v_client_id,
          'business_hours_gated', false
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Also update the follow-up trigger to always queue immediately
CREATE OR REPLACE FUNCTION public.trigger_follow_up_outbound_call()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_client_id UUID;
  v_voice_agent_id UUID;
  v_follow_up_config RECORD;
  v_attempt_count INT;
  v_last_call_at TIMESTAMPTZ;
  v_delay_interval INTERVAL;
BEGIN
  -- Only process status changes to specific statuses that warrant follow-up
  IF OLD.status IS DISTINCT FROM NEW.status AND 
     NEW.status IN ('no_answer', 'busy', 'failed') THEN
    
    -- Get org settings for follow-up configuration
    SELECT ocs.*, jl.client_id
    INTO v_follow_up_config
    FROM outbound_calls oc
    LEFT JOIN applications a ON a.id = oc.application_id
    LEFT JOIN job_listings jl ON jl.id = a.job_listing_id
    LEFT JOIN organization_call_settings ocs ON ocs.organization_id = oc.organization_id
    WHERE oc.id = NEW.id;
    
    -- Check if auto follow-up is enabled
    IF v_follow_up_config.auto_follow_up_enabled IS NOT TRUE THEN
      RETURN NEW;
    END IF;
    
    -- Count previous attempts for this application
    SELECT COUNT(*), MAX(created_at)
    INTO v_attempt_count, v_last_call_at
    FROM outbound_calls
    WHERE application_id = NEW.application_id;
    
    -- Check max attempts
    IF v_attempt_count >= COALESCE(v_follow_up_config.max_attempts, 3) THEN
      RETURN NEW;
    END IF;
    
    -- Calculate delay
    v_delay_interval := (COALESCE(v_follow_up_config.follow_up_delay_hours, 4)::TEXT || ' hours')::INTERVAL;
    
    -- Find the voice agent (same priority logic)
    v_org_id := NEW.organization_id;
    v_client_id := v_follow_up_config.client_id;
    
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
    
    -- Queue follow-up call with delay (scheduled_at for retry delay, not business hours)
    IF v_voice_agent_id IS NOT NULL THEN
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
        NOW() + v_delay_interval,
        jsonb_build_object(
          'applicant_name', NEW.metadata->>'applicant_name',
          'triggered_by', 'auto_follow_up',
          'previous_status', NEW.status,
          'attempt_number', v_attempt_count + 1,
          'business_hours_gated', false
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;
