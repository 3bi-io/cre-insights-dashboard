-- Assign Robbie.ballard@me.com as Administrator for AcquireROI
DO $$
DECLARE
  acquireroi_org_id uuid;
  v_user_id uuid;
BEGIN
  -- Get AcquireROI organization ID
  SELECT id INTO acquireroi_org_id FROM organizations WHERE slug = 'acquireroi' OR name = 'AcquireROI' LIMIT 1;

  -- Robbie.ballard@me.com - AcquireROI Administrator
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'Robbie.ballard@me.com' LIMIT 1;
  IF v_user_id IS NOT NULL AND acquireroi_org_id IS NOT NULL THEN
    UPDATE profiles SET organization_id = acquireroi_org_id, updated_at = now() WHERE id = v_user_id;
    INSERT INTO user_roles (user_id, role, organization_id)
    VALUES (v_user_id, 'admin'::app_role, acquireroi_org_id)
    ON CONFLICT (user_id, role) DO UPDATE SET organization_id = acquireroi_org_id;
  END IF;

END $$;