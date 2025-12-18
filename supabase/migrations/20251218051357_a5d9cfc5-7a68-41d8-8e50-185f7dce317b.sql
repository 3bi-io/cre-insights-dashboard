-- Fix existing follow_up trigger to use is_active instead of status
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
    
    -- Find an enabled outbound voice agent for this organization (FIXED: use is_active instead of status)
    SELECT id INTO v_voice_agent_id
    FROM voice_agents
    WHERE organization_id = v_org_id
      AND is_outbound_enabled = true
      AND agent_phone_number_id IS NOT NULL
      AND is_active = true
    LIMIT 1;
    
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
          'previous_status', OLD.status
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create new INSERT trigger function for automatic outbound calls on application submission
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
    
    -- Find an enabled outbound voice agent for this organization
    SELECT id INTO v_voice_agent_id
    FROM voice_agents
    WHERE organization_id = v_org_id
      AND is_outbound_enabled = true
      AND agent_phone_number_id IS NOT NULL
      AND is_active = true
    LIMIT 1;
    
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
          'source', COALESCE(NEW.source, 'unknown')
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the INSERT trigger on applications table
DROP TRIGGER IF EXISTS trigger_new_application_outbound_call ON applications;
CREATE TRIGGER trigger_new_application_outbound_call
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_application_insert_outbound_call();