-- Grant super admins full access to all organization data
-- Drop existing policies first to avoid conflicts

-- Organizations table
DROP POLICY IF EXISTS "Super admins have full access to organizations" ON public.organizations;
CREATE POLICY "Super admins have full access to organizations"
ON public.organizations
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Organization features
DROP POLICY IF EXISTS "Super admins can manage all organization features" ON public.organization_features;
CREATE POLICY "Super admins can manage all organization features"
ON public.organization_features
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Profiles - add policies for super admins
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
CREATE POLICY "Super admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- User roles
DROP POLICY IF EXISTS "Super admins can manage all user roles" ON public.user_roles;
CREATE POLICY "Super admins can manage all user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));