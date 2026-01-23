-- ============================================================
-- Fix Client-Aware Outbound Voice Agent Routing
-- ============================================================
-- This migration updates the trigger functions to prefer 
-- client-specific outbound agents when routing applications.
-- ============================================================

-- Replace trigger_application_insert_outbound_call with client-aware routing
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
BEGIN
  -- Only proceed if phone number exists and is valid
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND length(NEW.phone) >= 10 THEN
    -- Get organization ID AND client ID from job listing
    SELECT jl.organization_id, jl.client_id INTO v_org_id, v_client_id
    FROM job_listings jl
    WHERE jl.id = NEW.job_listing_id;
    
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
    
    -- Fall back to org-level agent (client_id IS NULL) if no client match
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
    
    -- Create queued outbound call if we found an agent
    IF v_voice_agent_id IS NOT NULL THEN
      INSERT INTO outbound_calls (
        application_id,
        voice_agent_id,
        organization_id,
        phone_number,
        status,
        metadata
      ) VALUES (
        NEW.id,
        v_voice_agent_id,
        v_org_id,
        NEW.phone,
        'queued',
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
$function$;

-- Replace trigger_follow_up_outbound_call with client-aware routing
CREATE OR REPLACE FUNCTION public.trigger_follow_up_outbound_call()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_org_id UUID;
  v_client_id UUID;
  v_voice_agent_id UUID;
  v_follow_up_config RECORD;
  v_hours_since_last_call NUMERIC;
  v_last_call_status TEXT;
  v_attempt_count INT;
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
      IF v_attempt_count < COALESCE(v_follow_up_config.max_follow_up_attempts, 3) THEN
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
        
        -- Schedule follow-up call
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
            NOW() + INTERVAL '1 hour' * COALESCE(v_follow_up_config.follow_up_delay_hours, 4),
            jsonb_build_object(
              'triggered_by', 'follow_up',
              'previous_call_id', NEW.id,
              'previous_status', NEW.status,
              'attempt_number', v_attempt_count + 1,
              'client_id', v_client_id
            )
          );
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add comment for documentation
COMMENT ON FUNCTION public.trigger_application_insert_outbound_call() IS 
'Trigger function to create outbound calls on new applications. Prefers client-specific agents, falls back to org-level, then platform default.';

COMMENT ON FUNCTION public.trigger_follow_up_outbound_call() IS 
'Trigger function to schedule follow-up calls. Prefers client-specific agents, falls back to org-level, then platform default.';