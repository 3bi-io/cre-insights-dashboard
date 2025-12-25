-- Allow public users to view clients that have active job listings
CREATE POLICY "Public can view clients with active jobs" 
ON public.clients 
FOR SELECT 
TO public
USING (
  EXISTS (
    SELECT 1 FROM job_listings jl 
    WHERE jl.client_id = clients.id 
    AND jl.status = 'active'
  )
);