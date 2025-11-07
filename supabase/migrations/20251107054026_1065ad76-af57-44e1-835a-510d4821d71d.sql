-- Enable public read access to organizations for job listings page
-- This allows unauthenticated users to view basic organization info (name, slug)
-- which is necessary for displaying job listings publicly

DROP POLICY IF EXISTS "Public can view organizations for job listings" ON public.organizations;

CREATE POLICY "Public can view organizations for job listings" 
ON public.organizations
FOR SELECT 
USING (true);