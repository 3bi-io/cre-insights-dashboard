-- Assign truckinjimmyhayes@gmail.com as admin for Hayes organization
DO $$
DECLARE
  v_user_id uuid;
  v_hayes_org_id uuid := '84214b48-7b51-45bc-ad7f-723bcf50466c';
BEGIN
  -- Find user by email
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'truckinjimmyhayes@gmail.com' LIMIT 1;

  -- If user exists, assign admin role and organization
  IF v_user_id IS NOT NULL THEN
    -- Update profile with Hayes organization
    UPDATE public.profiles 
    SET organization_id = v_hayes_org_id,
        updated_at = now()
    WHERE id = v_user_id;

    -- Insert if profile doesn't exist
    INSERT INTO public.profiles (id, email, full_name, organization_id)
    VALUES (v_user_id, 'truckinjammyhayes@gmail.com', 'Jimmy Hayes', v_hayes_org_id)
    ON CONFLICT (id) DO UPDATE 
    SET organization_id = v_hayes_org_id,
        updated_at = now();

    -- Grant admin role
    INSERT INTO public.user_roles (user_id, role, organization_id)
    VALUES (v_user_id, 'admin'::app_role, v_hayes_org_id)
    ON CONFLICT (user_id, role) 
    DO UPDATE SET organization_id = v_hayes_org_id;

    -- Enable all organization features for Hayes
    INSERT INTO public.organization_features (organization_id, feature_name, enabled, settings)
    VALUES 
      (v_hayes_org_id, 'meta_integration', true, '{}'),
      (v_hayes_org_id, 'openai_access', true, '{}'),
      (v_hayes_org_id, 'anthropic_access', true, '{}'),
      (v_hayes_org_id, 'tenstreet_access', true, '{}'),
      (v_hayes_org_id, 'voice_agent', true, '{}'),
      (v_hayes_org_id, 'elevenlabs_access', true, '{}'),
      (v_hayes_org_id, 'advanced_analytics', true, '{}')
    ON CONFLICT (organization_id, feature_name) 
    DO UPDATE SET enabled = true, updated_at = now();

    -- Enable all platform access for Hayes
    INSERT INTO public.organization_platform_access (organization_id, platform_name, enabled)
    VALUES 
      (v_hayes_org_id, 'Meta', true),
      (v_hayes_org_id, 'Indeed', true),
      (v_hayes_org_id, 'Craigslist', true),
      (v_hayes_org_id, 'ZipRecruiter', true),
      (v_hayes_org_id, 'LinkedIn', true)
    ON CONFLICT (organization_id, platform_name) 
    DO UPDATE SET enabled = true, updated_at = now();
  END IF;
END $$;