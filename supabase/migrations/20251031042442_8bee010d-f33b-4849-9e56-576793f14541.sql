-- =====================================================
-- CRITICAL SECURITY FIX: Organization Public Access
-- =====================================================
-- Issue: Organizations table has overly permissive public SELECT policy
-- exposing sensitive data (subscription_status, settings, etc.)
-- 
-- Solution: Remove public access and create a secure view with only
-- safe fields for public job listings
-- =====================================================

-- Drop the overly permissive public policy if it exists
DROP POLICY IF EXISTS "Public can view organizations for job listings" ON organizations;
DROP POLICY IF EXISTS "Public can view organizations" ON organizations;

-- Create a secure view with only public-safe fields
CREATE OR REPLACE VIEW public.public_organization_info AS
SELECT 
  o.id,
  o.name,
  o.slug,
  o.logo_url
FROM public.organizations o
WHERE EXISTS (
  SELECT 1 
  FROM public.job_listings jl
  WHERE jl.organization_id = o.id
    AND jl.status = 'active'
);

-- Grant SELECT on the view to anonymous and authenticated users
GRANT SELECT ON public.public_organization_info TO anon, authenticated;

-- Add comment explaining the security consideration
COMMENT ON VIEW public.public_organization_info IS 
'Public-safe organization data for job listings. Only shows organizations with active jobs. Does not expose sensitive fields like subscription_status or settings.';

-- Ensure existing policies for authenticated users remain intact
-- Super admins can view all organizations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organizations' 
    AND policyname = 'Super admins can view all organizations'
  ) THEN
    CREATE POLICY "Super admins can view all organizations"
    ON organizations FOR SELECT
    USING (is_super_admin(auth.uid()));
  END IF;
END $$;

-- Organization members can view their own organization
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organizations' 
    AND policyname = 'Users can view their organization'
  ) THEN
    CREATE POLICY "Users can view their organization"
    ON organizations FOR SELECT
    USING (id = get_user_organization_id());
  END IF;
END $$;

-- Organization admins can update their organization
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organizations' 
    AND policyname = 'Admins can update their organization'
  ) THEN
    CREATE POLICY "Admins can update their organization"
    ON organizations FOR UPDATE
    USING (
      id = get_user_organization_id() 
      AND has_role(auth.uid(), 'admin'::app_role)
    );
  END IF;
END $$;