-- Add public read access for clients with active jobs
-- This allows unauthenticated users to browse the Companies page

CREATE POLICY "Public can view active clients with jobs"
  ON public.clients
  FOR SELECT
  TO public
  USING (
    status = 'active' 
    AND EXISTS (
      SELECT 1 FROM job_listings jl 
      WHERE jl.client_id = clients.id 
      AND jl.status = 'active'
    )
  );