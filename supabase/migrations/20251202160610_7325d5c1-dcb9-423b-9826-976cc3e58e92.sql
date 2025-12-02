-- Allow public (unauthenticated) users to view organization basic info
-- This enables the job listings query to work for unauthenticated users on /jobs page
CREATE POLICY "Public can view organizations"
ON public.organizations
FOR SELECT
TO public
USING (true);