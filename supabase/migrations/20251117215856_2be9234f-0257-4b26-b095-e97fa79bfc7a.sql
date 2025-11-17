-- ============================================
-- FIX 1: Remove public access to organizations table
-- ============================================

-- Drop the public policy that exposes sensitive data
DROP POLICY IF EXISTS "Public can view organizations for job listings" ON public.organizations;

-- The secure view 'public_organization_info' already exists with only safe fields
-- Frontend should use this view instead for unauthenticated access

-- Verify authenticated users can still access their own organization
-- This policy should already exist from previous migrations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organizations' 
    AND policyname = 'Users can view their own organization'
  ) THEN
    CREATE POLICY "Users can view their own organization"
    ON public.organizations
    FOR SELECT
    USING (id = get_user_organization_id());
  END IF;
END $$;