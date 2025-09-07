-- Ensure helper function to assign admin by email for a specific org slug
CREATE OR REPLACE FUNCTION public.ensure_admin_for_email(_email text, _org_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  -- Ensure organization exists and fetch id
  SELECT id INTO v_org_id FROM public.organizations WHERE slug = _org_slug LIMIT 1;
  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations (slug, name)
    VALUES (_org_slug, initcap(replace(_org_slug, '-', ' ')))
    RETURNING id INTO v_org_id;
  END IF;

  -- Find user by email (in auth schema)
  SELECT id INTO v_user_id FROM auth.users WHERE email = _email LIMIT 1;

  -- If user exists, ensure profile and admin role (scoped to org)
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, full_name, organization_id)
    VALUES (v_user_id, _email, _email, v_org_id)
    ON CONFLICT (id)
    DO UPDATE SET organization_id = EXCLUDED.organization_id,
                  email = EXCLUDED.email,
                  updated_at = now();

    INSERT INTO public.user_roles (user_id, role, organization_id)
    VALUES (v_user_id, 'admin'::app_role, v_org_id)
    ON CONFLICT (user_id, role)
    DO UPDATE SET organization_id = EXCLUDED.organization_id,
                  created_at = user_roles.created_at;
  END IF;
END;
$$;

-- Update signup trigger to grant admin for these specific emails
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
  IF NEW.email = 'c@3bi.io' THEN
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

-- Assign admins now for existing accounts (no-op if not signed up yet)
SELECT public.ensure_admin_for_email('wayne.cereholm@crengland.com', 'cr-england');
SELECT public.ensure_admin_for_email('ken.munck@crengland.com', 'cr-england');