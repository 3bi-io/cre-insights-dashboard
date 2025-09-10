-- Detach super admin from CR England organization without affecting super_admin role
DO $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  -- Locate the user and organization
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'andrew.w.gadomski@gmail.com' LIMIT 1;
  SELECT id INTO v_org_id FROM public.organizations WHERE slug = 'cr-england' OR lower(name) = 'cr england' LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User with email % not found', 'andrew.w.gadomski@gmail.com';
    RETURN;
  END IF;

  -- Ensure the user retains global super_admin (org-independent)
  PERFORM public.ensure_super_admin_for_email('andrew.w.gadomski@gmail.com');

  -- If CR England org exists, detach the user from it
  IF v_org_id IS NOT NULL THEN
    -- Clear organization association on profile if it matches CR England
    UPDATE public.profiles
    SET organization_id = NULL,
        updated_at = now()
    WHERE id = v_user_id AND organization_id = v_org_id;

    -- Remove any org-scoped roles for CR England (keep super_admin which is org NULL)
    DELETE FROM public.user_roles
    WHERE user_id = v_user_id
      AND organization_id = v_org_id;
  ELSE
    RAISE NOTICE 'CR England organization not found by slug/name; no org-scoped cleanup needed';
  END IF;
END $$;
