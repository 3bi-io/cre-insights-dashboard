-- Fix RLS policies for public access to job listings
-- Drop existing policies first
DROP POLICY IF EXISTS "Public can view active job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Organization members can view job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Super admins can view all job listings" ON public.job_listings;

-- Create a single comprehensive SELECT policy that handles all cases
CREATE POLICY "Job listings read access" ON public.job_listings
FOR SELECT USING (
  -- Public can view active jobs
  status = 'active' OR
  -- Organization members can view their org's jobs
  (organization_id = get_user_organization_id()) OR
  -- Super admins can view all jobs
  is_super_admin(auth.uid())
);

-- Ensure organizations table is publicly readable for job listings
DROP POLICY IF EXISTS "Public can view organizations" ON public.organizations;
CREATE POLICY "Public can view organizations for job listings" ON public.organizations
FOR SELECT USING (true);

-- Ensure job_categories table remains publicly readable
-- (Already has "Anyone can view job categories" policy)

-- Ensure clients table is readable for job listings context
DROP POLICY IF EXISTS "Public can view clients for job listings" ON public.clients;
CREATE POLICY "Public can view clients for job listings" ON public.clients
FOR SELECT USING (true);