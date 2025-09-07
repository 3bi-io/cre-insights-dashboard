-- Create helper to ensure super admin role by email
CREATE OR REPLACE FUNCTION public.ensure_super_admin_for_email(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Find user by email
  SELECT id INTO v_user_id FROM auth.users WHERE email = _email LIMIT 1;

  -- If user exists, upsert profile and grant super_admin (org-independent)
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, full_name, organization_id)
    VALUES (v_user_id, _email, _email, NULL)
    ON CONFLICT (id)
    DO UPDATE SET email = EXCLUDED.email,
                  updated_at = now();

    INSERT INTO public.user_roles (user_id, role, organization_id)
    VALUES (v_user_id, 'super_admin'::app_role, NULL)
    ON CONFLICT (user_id, role)
    DO UPDATE SET organization_id = NULL,
                  created_at = user_roles.created_at;
  END IF;
END;
$$;

-- Update signup trigger to include this super admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_role app_role;
BEGIN
  IF NEW.email IN ('c@3bi.io','andrew.w.gadomski@gmail.com') THEN
    v_role := 'super_admin'::app_role;
    v_org_id := NULL;
  ELSIF NEW.email IN ('wayne.cereholm@crengland.com','ken.munck@crengland.com') THEN
    v_role := 'admin'::app_role;
    SELECT public.get_org_id_by_slug('cr-england') INTO v_org_id;
  ELSE
    v_role := 'user'::app_role;
    SELECT public.get_org_id_by_slug('cr-england') INTO v_org_id;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    v_org_id
  );

  INSERT INTO public.user_roles (user_id, role, organization_id)
  VALUES (NEW.id, v_role, v_org_id)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Apply role now if account already exists
SELECT public.ensure_super_admin_for_email('andrew.w.gadomski@gmail.com');