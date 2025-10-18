-- Assign new administrators to organizations
DO $$
DECLARE
  acquireroi_org_id uuid;
  hayes_recruiting_org_id uuid;
  v_user_id uuid;
BEGIN
  -- Get organization IDs
  SELECT id INTO acquireroi_org_id FROM organizations WHERE slug = 'acquireroi' OR name = 'AcquireROI' LIMIT 1;
  SELECT id INTO hayes_recruiting_org_id FROM organizations WHERE slug = 'hayes-recruiting-solutions' LIMIT 1;

  -- cameron@acquireroi.com - AcquireROI Administrator
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'cameron@acquireroi.com' LIMIT 1;
  IF v_user_id IS NOT NULL AND acquireroi_org_id IS NOT NULL THEN
    UPDATE profiles SET organization_id = acquireroi_org_id, updated_at = now() WHERE id = v_user_id;
    INSERT INTO user_roles (user_id, role, organization_id)
    VALUES (v_user_id, 'admin'::app_role, acquireroi_org_id)
    ON CONFLICT (user_id, role) DO UPDATE SET organization_id = acquireroi_org_id;
  END IF;

  -- truckinjimmyhayes@gmail.com - hayes-recruiting-solutions Administrator
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'truckinjimmyhayes@gmail.com' LIMIT 1;
  IF v_user_id IS NOT NULL AND hayes_recruiting_org_id IS NOT NULL THEN
    UPDATE profiles SET organization_id = hayes_recruiting_org_id, updated_at = now() WHERE id = v_user_id;
    INSERT INTO user_roles (user_id, role, organization_id)
    VALUES (v_user_id, 'admin'::app_role, hayes_recruiting_org_id)
    ON CONFLICT (user_id, role) DO UPDATE SET organization_id = hayes_recruiting_org_id;
  END IF;

END $$;