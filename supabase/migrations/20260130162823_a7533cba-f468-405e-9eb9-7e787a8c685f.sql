-- ============================================================
-- INSERT EMBED FORM OUTBOUND VOICE AGENT
-- Routes all /embed/apply submissions to dedicated agent
-- Agent ID: agent_3201kfp75kshfgwr1kfs310715z3
-- Phone ID: phnum_6901kg7vdsf5em2sh1cc1933d8j4
-- ============================================================

-- Insert only if not exists
INSERT INTO voice_agents (
  agent_name,
  agent_id,
  elevenlabs_agent_id,
  agent_phone_number_id,
  organization_id,
  client_id,
  is_active,
  is_outbound_enabled,
  is_platform_default,
  llm_model,
  description
) 
SELECT
  'Outbound Agent - Embed Form',
  'agent_3201kfp75kshfgwr1kfs310715z3',
  'agent_3201kfp75kshfgwr1kfs310715z3',
  'phnum_6901kg7vdsf5em2sh1cc1933d8j4',
  NULL,
  NULL,
  true,
  true,
  false,
  'gpt-4o-mini',
  'Dedicated outbound calling agent for embed form submissions. Triggered when source = Embed Form.'
WHERE NOT EXISTS (
  SELECT 1 FROM voice_agents WHERE agent_id = 'agent_3201kfp75kshfgwr1kfs310715z3'
);

-- Update if already exists
UPDATE voice_agents
SET 
  agent_name = 'Outbound Agent - Embed Form',
  agent_phone_number_id = 'phnum_6901kg7vdsf5em2sh1cc1933d8j4',
  is_active = true,
  is_outbound_enabled = true,
  description = 'Dedicated outbound calling agent for embed form submissions. Triggered when source = Embed Form.',
  updated_at = now()
WHERE agent_id = 'agent_3201kfp75kshfgwr1kfs310715z3';

-- ============================================================
-- UPDATE TRIGGER: Add Embed Form priority routing
-- Priority 0: Embed Form → dedicated agent
-- Priority 1: Client-specific agent
-- Priority 2: Organization-level agent
-- Priority 3: Platform default agent
-- ============================================================

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
          metadata
        ) VALUES (
          NEW.id,
          v_voice_agent_id,
          NULL,
          NEW.phone,
          'queued',
          jsonb_build_object(
            'applicant_name', COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''),
            'triggered_by', 'embed_form_submission',
            'source', 'Embed Form'
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