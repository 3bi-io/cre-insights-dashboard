-- Fix: Remove public access to organizations table to prevent sensitive data exposure
-- The public_organization_info view should be used for public access instead

-- Step 1: Drop the permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view organizations with active jobs" ON public.organizations;

-- Step 2: Create a function to check if access is through the secure view
-- This allows the view to work while blocking direct table access from public

-- Step 3: Create new restrictive policies for authenticated access only

-- Policy for org members to view their own organization (full access)
-- This allows authenticated users in the organization to see all fields
CREATE POLICY "Members can view their organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (id = get_user_organization_id());

-- Policy for job_listings join - only return minimal fields via the existing relationship
-- Since we can't do column-level RLS, we rely on the view for public access
-- The join from job_listings will fail for anonymous users without this policy
-- Instead, public job board should use the public_organization_info view

-- Note: The public_organization_info view with security_invoker=true will need
-- its own mechanism. Let's create a security definer function for public org lookup

-- Create a security definer function for public organization info lookup
CREATE OR REPLACE FUNCTION public.get_public_organization_info(org_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  logo_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.name, o.slug, o.logo_url
  FROM public.organizations o
  WHERE o.id = org_id
  AND EXISTS (
    SELECT 1 FROM public.job_listings jl
    WHERE jl.organization_id = o.id
    AND jl.status = 'active'
  );
$$;

-- Create a function to get public org info by slug
CREATE OR REPLACE FUNCTION public.get_public_organization_by_slug(org_slug text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  logo_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.name, o.slug, o.logo_url
  FROM public.organizations o
  WHERE o.slug = org_slug
  AND EXISTS (
    SELECT 1 FROM public.job_listings jl
    WHERE jl.organization_id = o.id
    AND jl.status = 'active'
  );
$$;

-- Grant execute to anonymous users
GRANT EXECUTE ON FUNCTION public.get_public_organization_info(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_organization_by_slug(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_organization_info(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_organization_by_slug(text) TO authenticated;

-- Update the public_organization_info view to use security_definer approach
-- First drop the existing view
DROP VIEW IF EXISTS public.public_organization_info;

-- Recreate as a security definer view that only exposes safe columns
-- and only for organizations with active jobs
CREATE VIEW public.public_organization_info 
WITH (security_invoker = false)
AS
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
GRANT SELECT ON public.public_organization_info TO anon;
GRANT SELECT ON public.public_organization_info TO authenticated;

-- Add a policy to allow the view owner to select from organizations
-- This is needed because the view runs as the view owner
CREATE POLICY "View can access for public_organization_info"
ON public.organizations
FOR SELECT
TO anon
USING (false);  -- Anonymous users cannot directly access the table

-- For the job board join to work, we need to allow the SELECT through RPC
-- The frontend will need to use the RPC function or view instead of direct join