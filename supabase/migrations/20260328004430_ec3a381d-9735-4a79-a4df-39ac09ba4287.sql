
-- Remove PRIORITY 3 (platform default fallback) from the outbound call trigger
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
    
    -- No platform default fallback — if no agent assigned, no call is queued
    
    -- Queue call with client-aware business hours check in metadata
    IF v_voice_agent_id IS NOT NULL THEN
      INSERT INTO outbound_calls (
        application_id, voice_agent_id, organization_id, phone_number,
        status, scheduled_at, metadata
      ) VALUES (
        NEW.id, v_voice_agent_id, v_org_id, NEW.phone, 'queued', NULL,
        jsonb_build_object(
          'applicant_name', COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''),
          'triggered_by', 'application_submission',
          'source', COALESCE(NEW.source, 'unknown'),
          'client_id', v_client_id,
          'business_hours_gated', false,
          'is_within_business_hours', is_within_business_hours(v_org_id, v_client_id)
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
