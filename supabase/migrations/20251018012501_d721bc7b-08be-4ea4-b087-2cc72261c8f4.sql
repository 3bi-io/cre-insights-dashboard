-- Add unique constraint on elevenlabs_agent_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'voice_agents_elevenlabs_agent_id_key'
  ) THEN
    ALTER TABLE voice_agents 
    ADD CONSTRAINT voice_agents_elevenlabs_agent_id_key UNIQUE (elevenlabs_agent_id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Update voice agents with their organization mappings
DO $$
DECLARE
  hayes_org_id uuid;
  cr_england_org_id uuid;
  acquireroi_org_id uuid;
  garmin_org_id uuid;
  acme_org_id uuid;
  tbi_org_id uuid;
BEGIN
  -- Get organization IDs
  SELECT id INTO hayes_org_id FROM organizations WHERE name = 'Hayes' OR slug = 'hayes' LIMIT 1;
  SELECT id INTO cr_england_org_id FROM organizations WHERE name = 'CR England' OR slug = 'cr-england' LIMIT 1;
  SELECT id INTO acquireroi_org_id FROM organizations WHERE name = 'AcquireROI' OR slug = 'acquireroi' LIMIT 1;
  SELECT id INTO garmin_org_id FROM organizations WHERE name = 'Garmin Media' OR slug = 'garmin-media' LIMIT 1;
  SELECT id INTO acme_org_id FROM organizations WHERE name = 'ACME' OR slug = 'acme' LIMIT 1;
  SELECT id INTO tbi_org_id FROM organizations WHERE name = '3BI' OR slug = '3bi' LIMIT 1;

  -- Update or insert voice agents with organization mappings
  -- Hayes
  IF hayes_org_id IS NOT NULL THEN
    INSERT INTO voice_agents (organization_id, elevenlabs_agent_id, agent_name, is_active, agent_id)
    VALUES (hayes_org_id, 'agent_6501k6ztk1sfe6ermx5yz647jssv', 'Hayes Voice Agent', true, 'agent_6501k6ztk1sfe6ermx5yz647jssv')
    ON CONFLICT (elevenlabs_agent_id) 
    DO UPDATE SET organization_id = hayes_org_id, agent_name = 'Hayes Voice Agent';
  END IF;

  -- CR England
  IF cr_england_org_id IS NOT NULL THEN
    INSERT INTO voice_agents (organization_id, elevenlabs_agent_id, agent_name, is_active, agent_id)
    VALUES (cr_england_org_id, 'agent_01jwedntnjf7tt0qma00a2276r', 'CR England Voice Agent', true, 'agent_01jwedntnjf7tt0qma00a2276r')
    ON CONFLICT (elevenlabs_agent_id) 
    DO UPDATE SET organization_id = cr_england_org_id, agent_name = 'CR England Voice Agent';
  END IF;

  -- AcquireROI
  IF acquireroi_org_id IS NOT NULL THEN
    INSERT INTO voice_agents (organization_id, elevenlabs_agent_id, agent_name, is_active, agent_id)
    VALUES (acquireroi_org_id, 'agent_7301k7t5jk5hecsvmpjge528ehac', 'AcquireROI Voice Agent', true, 'agent_7301k7t5jk5hecsvmpjge528ehac')
    ON CONFLICT (elevenlabs_agent_id) 
    DO UPDATE SET organization_id = acquireroi_org_id, agent_name = 'AcquireROI Voice Agent';
  END IF;

  -- Garmin Media
  IF garmin_org_id IS NOT NULL THEN
    INSERT INTO voice_agents (organization_id, elevenlabs_agent_id, agent_name, is_active, agent_id)
    VALUES (garmin_org_id, 'agent_5001k7t5gqq8et7bgfrykzrcpnb5', 'Garmin Media Voice Agent', true, 'agent_5001k7t5gqq8et7bgfrykzrcpnb5')
    ON CONFLICT (elevenlabs_agent_id) 
    DO UPDATE SET organization_id = garmin_org_id, agent_name = 'Garmin Media Voice Agent';
  END IF;

  -- ACME
  IF acme_org_id IS NOT NULL THEN
    INSERT INTO voice_agents (organization_id, elevenlabs_agent_id, agent_name, is_active, agent_id)
    VALUES (acme_org_id, 'agent_3901k7s5pyt9fsfb17w72f8hf59z', 'ACME Voice Agent', true, 'agent_3901k7s5pyt9fsfb17w72f8hf59z')
    ON CONFLICT (elevenlabs_agent_id) 
    DO UPDATE SET organization_id = acme_org_id, agent_name = 'ACME Voice Agent';
  END IF;

  -- 3BI
  IF tbi_org_id IS NOT NULL THEN
    INSERT INTO voice_agents (organization_id, elevenlabs_agent_id, agent_name, is_active, agent_id)
    VALUES (tbi_org_id, 'agent_01jwede7nve1nsm3ngqn7ks8d9', '3BI Voice Agent', true, 'agent_01jwede7nve1nsm3ngqn7ks8d9')
    ON CONFLICT (elevenlabs_agent_id) 
    DO UPDATE SET organization_id = tbi_org_id, agent_name = '3BI Voice Agent';
  END IF;

END $$;