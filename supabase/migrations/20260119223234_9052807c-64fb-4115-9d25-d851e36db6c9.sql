-- Migration: Add platform default voice agent support

-- Step 1: Add is_platform_default column to voice_agents table
ALTER TABLE voice_agents
ADD COLUMN is_platform_default BOOLEAN DEFAULT false;

-- Add a partial unique index to ensure only one platform default exists
CREATE UNIQUE INDEX idx_voice_agents_platform_default 
ON voice_agents (is_platform_default) 
WHERE is_platform_default = true;

-- Step 2: Mark Hayes Outbound Agent as the platform default
UPDATE voice_agents
SET is_platform_default = true
WHERE id = '9955df3e-a9ec-4fa8-adaf-6dd9b6227312';

-- Step 3: Update the trigger function to use platform default fallback
CREATE OR REPLACE FUNCTION public.trigger_application_insert_outbound_call()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_org_id UUID;
  v_voice_agent_id UUID;
BEGIN
  -- Only trigger if phone exists
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    -- Get organization ID from job listing
    SELECT jl.organization_id INTO v_org_id
    FROM job_listings jl
    WHERE jl.id = NEW.job_listing_id;
    
    -- First: Try to find an enabled outbound voice agent for this organization
    SELECT id INTO v_voice_agent_id
    FROM voice_agents
    WHERE organization_id = v_org_id
      AND is_outbound_enabled = true
      AND agent_phone_number_id IS NOT NULL
      AND is_active = true
    LIMIT 1;
    
    -- Second: If no org-specific agent, fall back to platform default
    IF v_voice_agent_id IS NULL THEN
      SELECT id INTO v_voice_agent_id
      FROM voice_agents
      WHERE is_platform_default = true
        AND is_outbound_enabled = true
        AND agent_phone_number_id IS NOT NULL
        AND is_active = true
      LIMIT 1;
    END IF;
    
    -- Only queue if we found an enabled voice agent
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
          'used_platform_default', v_voice_agent_id != (
            SELECT id FROM voice_agents 
            WHERE organization_id = v_org_id 
              AND is_outbound_enabled = true 
            LIMIT 1
          )
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Step 4: Also update the follow-up trigger for consistency
CREATE OR REPLACE FUNCTION public.trigger_follow_up_outbound_call()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_org_id UUID;
  v_voice_agent_id UUID;
BEGIN
  -- Only trigger when status changes TO 'follow_up' and phone exists
  IF NEW.status = 'follow_up' AND (OLD.status IS NULL OR OLD.status != 'follow_up') AND NEW.phone IS NOT NULL THEN
    -- Get organization ID from job listing
    SELECT jl.organization_id INTO v_org_id
    FROM job_listings jl
    WHERE jl.id = NEW.job_listing_id;
    
    -- First: Find an enabled outbound voice agent for this organization
    SELECT id INTO v_voice_agent_id
    FROM voice_agents
    WHERE organization_id = v_org_id
      AND is_outbound_enabled = true
      AND agent_phone_number_id IS NOT NULL
      AND is_active = true
    LIMIT 1;
    
    -- Second: Fall back to platform default if no org-specific agent
    IF v_voice_agent_id IS NULL THEN
      SELECT id INTO v_voice_agent_id
      FROM voice_agents
      WHERE is_platform_default = true
        AND is_outbound_enabled = true
        AND agent_phone_number_id IS NOT NULL
        AND is_active = true
      LIMIT 1;
    END IF;
    
    -- Only queue if we found an enabled voice agent
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
          'triggered_by', 'status_change',
          'previous_status', OLD.status,
          'used_platform_default', v_voice_agent_id != (
            SELECT id FROM voice_agents 
            WHERE organization_id = v_org_id 
              AND is_outbound_enabled = true 
            LIMIT 1
          )
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;