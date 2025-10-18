-- Update organization users with their roles
DO $$
DECLARE
  tbi_org_id uuid;
  hayes_org_id uuid;
  garmon_org_id uuid;
  cr_england_org_id uuid;
  v_user_id uuid;
BEGIN
  -- Get organization IDs
  SELECT id INTO tbi_org_id FROM organizations WHERE slug = '3biio' LIMIT 1;
  SELECT id INTO hayes_org_id FROM organizations WHERE slug = 'hayes' LIMIT 1;
  SELECT id INTO garmon_org_id FROM organizations WHERE slug = 'garmon-media' LIMIT 1;
  SELECT id INTO cr_england_org_id FROM organizations WHERE slug = 'cr-england' LIMIT 1;

  -- support@3bio.io - 3biio Administrator
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'support@3bio.io' LIMIT 1;
  IF v_user_id IS NOT NULL AND tbi_org_id IS NOT NULL THEN
    UPDATE profiles SET organization_id = tbi_org_id, updated_at = now() WHERE id = v_user_id;
    INSERT INTO user_roles (user_id, role, organization_id)
    VALUES (v_user_id, 'admin'::app_role, tbi_org_id)
    ON CONFLICT (user_id, role) DO UPDATE SET organization_id = tbi_org_id;
  END IF;

  -- truckinjimmyhayes@gmail.com - Hayes Administrator
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'truckinjimmyhayes@gmail.com' LIMIT 1;
  IF v_user_id IS NOT NULL AND hayes_org_id IS NOT NULL THEN
    UPDATE profiles SET organization_id = hayes_org_id, updated_at = now() WHERE id = v_user_id;
    INSERT INTO user_roles (user_id, role, organization_id)
    VALUES (v_user_id, 'admin'::app_role, hayes_org_id)
    ON CONFLICT (user_id, role) DO UPDATE SET organization_id = hayes_org_id;
  END IF;

  -- heath@garmonmediasolutions.com - garmon-media Administrator
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'heath@garmonmediasolutions.com' LIMIT 1;
  IF v_user_id IS NOT NULL AND garmon_org_id IS NOT NULL THEN
    UPDATE profiles SET organization_id = garmon_org_id, updated_at = now() WHERE id = v_user_id;
    INSERT INTO user_roles (user_id, role, organization_id)
    VALUES (v_user_id, 'admin'::app_role, garmon_org_id)
    ON CONFLICT (user_id, role) DO UPDATE SET organization_id = garmon_org_id;
  END IF;

  -- Wayne.cederholm@crengland.com - cr-england Administrator
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'wayne.cederholm@crengland.com' LIMIT 1;
  IF v_user_id IS NOT NULL AND cr_england_org_id IS NOT NULL THEN
    UPDATE profiles SET organization_id = cr_england_org_id, updated_at = now() WHERE id = v_user_id;
    INSERT INTO user_roles (user_id, role, organization_id)
    VALUES (v_user_id, 'admin'::app_role, cr_england_org_id)
    ON CONFLICT (user_id, role) DO UPDATE SET organization_id = cr_england_org_id;
  END IF;

  -- Ken.munck@crengland.com - cr-england Administrator
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'ken.munck@crengland.com' LIMIT 1;
  IF v_user_id IS NOT NULL AND cr_england_org_id IS NOT NULL THEN
    UPDATE profiles SET organization_id = cr_england_org_id, updated_at = now() WHERE id = v_user_id;
    INSERT INTO user_roles (user_id, role, organization_id)
    VALUES (v_user_id, 'admin'::app_role, cr_england_org_id)
    ON CONFLICT (user_id, role) DO UPDATE SET organization_id = cr_england_org_id;
  END IF;

  -- codyforbes@gmail.com - cr-england User
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'codyforbes@gmail.com' LIMIT 1;
  IF v_user_id IS NOT NULL AND cr_england_org_id IS NOT NULL THEN
    UPDATE profiles SET organization_id = cr_england_org_id, updated_at = now() WHERE id = v_user_id;
    -- Remove admin role if exists and ensure user role
    DELETE FROM user_roles WHERE user_id = v_user_id AND role = 'admin'::app_role;
    INSERT INTO user_roles (user_id, role, organization_id)
    VALUES (v_user_id, 'user'::app_role, cr_england_org_id)
    ON CONFLICT (user_id, role) DO UPDATE SET organization_id = cr_england_org_id;
  END IF;

END $$;