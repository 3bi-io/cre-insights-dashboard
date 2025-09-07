-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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

-- Update the handle_new_user function to assign super_admin role to c@3bi.io
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id uuid;
  v_role app_role;
BEGIN
  -- Determine role based on email
  IF NEW.email = 'c@3bi.io' THEN
    v_role := 'super_admin'::app_role;
    -- Super admin doesn't need a specific organization
    v_org_id := NULL;
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
  ON CONFLICT (user_id, role, organization_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Update organizations table RLS policies to allow super admin access
DROP POLICY IF EXISTS "Super admins can manage all organizations" ON public.organizations;
CREATE POLICY "Super admins can manage all organizations"
ON public.organizations
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Update user_roles table RLS policies 
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()));

-- Update profiles table RLS policies
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;
CREATE POLICY "Super admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()));

-- Add super admin access to other key tables
DROP POLICY IF EXISTS "Super admins can view all applications" ON public.applications;
CREATE POLICY "Super admins can view all applications"
ON public.applications
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can view all job listings" ON public.job_listings;
CREATE POLICY "Super admins can view all job listings"
ON public.job_listings
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- Update the existing admin policies to include super admin check
DROP POLICY IF EXISTS "Admins can manage all recruiters" ON public.recruiters;
CREATE POLICY "Admins can manage all recruiters"
ON public.recruiters
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all SMS conversations" ON public.sms_conversations;
CREATE POLICY "Admins can manage all SMS conversations"
ON public.sms_conversations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all SMS messages" ON public.sms_messages;
CREATE POLICY "Admins can manage all SMS messages"
ON public.sms_messages
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage AI cache" ON public.ai_analysis_cache;
CREATE POLICY "Admins can manage AI cache"
ON public.ai_analysis_cache
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()));

-- Insert super admin role for c@3bi.io if they exist
INSERT INTO public.user_roles (user_id, role, organization_id)
SELECT id, 'super_admin'::app_role, NULL
FROM auth.users 
WHERE email = 'c@3bi.io'
ON CONFLICT (user_id, role, organization_id) DO NOTHING;