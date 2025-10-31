
-- Fix critical org admin access issues

-- ============================================================================
-- 1. FIX USER_ROLES POLICIES (CRITICAL SECURITY ISSUE)
-- Current policy allows org admins to manage ANY user's roles across ALL orgs
-- ============================================================================

-- Drop the insecure policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create properly scoped policy for org admins
CREATE POLICY "Org admins can manage roles in their org"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND user_id IN (
    SELECT id FROM public.profiles 
    WHERE organization_id = get_user_organization_id()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND user_id IN (
    SELECT id FROM public.profiles 
    WHERE organization_id = get_user_organization_id()
  )
);

-- ============================================================================
-- 2. FIX ORGANIZATION_FEATURES POLICIES
-- Org admins should be able to manage features for their organization
-- ============================================================================

-- Drop existing limited policy
DROP POLICY IF EXISTS "Admins can view their org features" ON public.organization_features;

-- Create comprehensive policy for org admins
CREATE POLICY "Org admins can manage their org features"
ON public.organization_features
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
);

-- ============================================================================
-- 3. FIX ORGANIZATION_PLATFORM_ACCESS POLICIES
-- Org admins should be able to manage platform access for their organization
-- ============================================================================

-- Drop existing limited policies
DROP POLICY IF EXISTS "Organization admins can view their platform access" ON public.organization_platform_access;
DROP POLICY IF EXISTS "Organization members can view their platform access" ON public.organization_platform_access;

-- Create comprehensive policy for org admins
CREATE POLICY "Org admins can manage their org platform access"
ON public.organization_platform_access
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
);

-- Keep view policy for regular org members
CREATE POLICY "Org members can view their platform access"
ON public.organization_platform_access
FOR SELECT
TO authenticated
USING (organization_id = get_user_organization_id());

-- ============================================================================
-- 4. FIX PROFILES POLICIES - Add proper WITH CHECK clauses
-- ============================================================================

-- Drop and recreate the org admin policy with proper WITH CHECK
DROP POLICY IF EXISTS "Admins can manage profiles in org" ON public.profiles;

CREATE POLICY "Org admins can manage profiles in org"
ON public.profiles
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
);
