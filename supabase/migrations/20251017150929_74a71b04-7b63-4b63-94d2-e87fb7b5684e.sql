-- Drop existing public view policy for clients
DROP POLICY IF EXISTS "Public can view clients for job listings" ON public.clients;

-- Create new policy: Only show clients that have job listings
CREATE POLICY "Users can view clients with jobs in org"
ON public.clients
FOR SELECT
USING (
  organization_id = get_user_organization_id()
  AND EXISTS (
    SELECT 1 FROM public.job_listings jl
    WHERE jl.client_id = clients.id
    AND jl.organization_id = clients.organization_id
  )
);

-- Allow super admins to view all clients with jobs
CREATE POLICY "Super admins can view all clients with jobs"
ON public.clients
FOR SELECT
USING (
  is_super_admin(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.job_listings jl
    WHERE jl.client_id = clients.id
  )
);

-- Public can view clients only if they have job listings
CREATE POLICY "Public can view clients with job listings"
ON public.clients
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.job_listings jl
    WHERE jl.client_id = clients.id
  )
);