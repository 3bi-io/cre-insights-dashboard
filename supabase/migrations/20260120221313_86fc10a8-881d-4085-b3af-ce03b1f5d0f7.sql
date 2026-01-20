-- MIGRATION 2: Update functions and policies to use recruiter role
-- Now that recruiter is committed in enum, we can use it

-- Step 1: Drop and recreate get_current_user_role with TEXT return type
DROP FUNCTION IF EXISTS public.get_current_user_role();

CREATE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    -- Check super_admin first (by email or role)
    (SELECT 'super_admin'::text WHERE EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND email = 'c@3bi.io'
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'::app_role
    )),
    -- Then check admin
    (SELECT 'admin'::text WHERE EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'::app_role
    )),
    -- Then check moderator
    (SELECT 'moderator'::text WHERE EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'moderator'::app_role
    )),
    -- Then check recruiter
    (SELECT 'recruiter'::text WHERE EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'recruiter'::app_role
    )),
    -- Default to user
    'user'::text
  )
$$;

COMMENT ON FUNCTION public.get_current_user_role() IS 'Returns highest-precedence role for current user. Hierarchy: super_admin > admin > moderator > recruiter > user';

-- Step 2: Create has_role_or_higher function for role hierarchy checks
CREATE OR REPLACE FUNCTION public.has_role_or_higher(_user_id UUID, _min_role text)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_role text;
  _role_hierarchy text[] := ARRAY['user', 'recruiter', 'moderator', 'admin', 'super_admin'];
  _user_level int;
  _min_level int;
BEGIN
  -- Get user's current role
  SELECT get_current_user_role() INTO _user_role;
  
  -- Find position in hierarchy
  SELECT array_position(_role_hierarchy, _user_role) INTO _user_level;
  SELECT array_position(_role_hierarchy, _min_role) INTO _min_level;
  
  -- Compare levels
  RETURN COALESCE(_user_level, 0) >= COALESCE(_min_level, 0);
END;
$$;

COMMENT ON FUNCTION public.has_role_or_higher(UUID, text) IS 'Check if user has role at or above the specified level in hierarchy';


-- Step 3: Fix handle_new_user to auto-create organization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _user_type text;
  _org_id uuid;
  _full_name text;
  _org_slug text;
  _org_name text;
BEGIN
  -- Get user_type from metadata
  _user_type := NEW.raw_user_meta_data->>'user_type';
  _full_name := NEW.raw_user_meta_data->>'full_name';
  
  -- For organization users, create a new organization automatically
  IF _user_type = 'organization' THEN
    -- Generate org name and slug from email domain or user name
    _org_name := COALESCE(
      _full_name || '''s Organization',
      split_part(NEW.email, '@', 1) || '''s Organization'
    );
    _org_slug := lower(regexp_replace(
      COALESCE(split_part(NEW.email, '@', 1), 'org') || '-' || substr(NEW.id::text, 1, 8),
      '[^a-z0-9-]', '-', 'g'
    ));
    
    -- Create organization
    INSERT INTO public.organizations (name, slug)
    VALUES (_org_name, _org_slug)
    RETURNING id INTO _org_id;
    
    -- Create admin role for new org owner
    INSERT INTO public.user_roles (user_id, role, organization_id)
    VALUES (NEW.id, 'admin'::app_role, _org_id);
  ELSE
    -- Jobseeker or NULL - no org assignment
    _org_id := NULL;
  END IF;

  -- Insert profile
  INSERT INTO public.profiles (id, full_name, email, user_type, organization_id)
  VALUES (
    NEW.id,
    COALESCE(_full_name, split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(_user_type, 'jobseeker'),
    _org_id
  );
  
  -- Create candidate_profile if jobseeker
  IF _user_type = 'jobseeker' OR _user_type IS NULL THEN
    INSERT INTO public.candidate_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile for new users. Org users get auto-created org with admin role. Jobseekers get candidate_profile. Removed cr-england fallback.';


-- Step 4: Add recruiter-specific RLS policies for applications
DROP POLICY IF EXISTS "Recruiters can view org applications" ON public.applications;
DROP POLICY IF EXISTS "Recruiters can update org applications" ON public.applications;

CREATE POLICY "Recruiters can view org applications"
ON public.applications FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'recruiter'::app_role)
  AND job_listing_id IN (
    SELECT id FROM job_listings 
    WHERE organization_id = get_user_organization_id()
  )
);

CREATE POLICY "Recruiters can update org applications"
ON public.applications FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'recruiter'::app_role)
  AND job_listing_id IN (
    SELECT id FROM job_listings 
    WHERE organization_id = get_user_organization_id()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'recruiter'::app_role)
  AND job_listing_id IN (
    SELECT id FROM job_listings 
    WHERE organization_id = get_user_organization_id()
  )
);