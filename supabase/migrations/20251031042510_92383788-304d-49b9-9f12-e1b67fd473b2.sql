-- =====================================================
-- CRITICAL SECURITY FIX: SECURITY DEFINER Functions
-- =====================================================
-- Re-create all critical security functions with proper search_path

-- 1. is_super_admin function
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id 
    AND email = 'c@3bi.io'
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role = 'super_admin'::app_role
  )
$$;

-- 2. has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND ur.organization_id = (
        SELECT organization_id FROM public.profiles WHERE id = _user_id
      )
  )
$$;

-- 3. get_user_organization_id function
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id 
  FROM public.profiles 
  WHERE id = auth.uid() 
  LIMIT 1
$$;

-- 4. get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT 'super_admin'::app_role WHERE EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')),
    (SELECT 'admin'::app_role WHERE EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')),
    (SELECT 'moderator'::app_role WHERE EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'moderator')),
    'user'::app_role
  )
$$;

-- 5. organization_has_platform_access function
CREATE OR REPLACE FUNCTION public.organization_has_platform_access(_org_id uuid, _platform_name text)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT enabled FROM public.organization_platform_access 
     WHERE organization_id = _org_id AND platform_name = _platform_name),
    true
  )
$$;

-- 6. get_user_platform_access function
CREATE OR REPLACE FUNCTION public.get_user_platform_access(_platform_name text)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.organization_has_platform_access(
    public.get_user_organization_id(),
    _platform_name
  )
$$;

-- 7. has_active_subscription function
CREATE OR REPLACE FUNCTION public.has_active_subscription(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = org_id
      AND subscription_status IN ('active', 'trialing')
  )
$$;

-- 8. get_org_id_by_slug function
CREATE OR REPLACE FUNCTION public.get_org_id_by_slug(_slug text)
RETURNS uuid
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.organizations WHERE slug = _slug LIMIT 1
$$;