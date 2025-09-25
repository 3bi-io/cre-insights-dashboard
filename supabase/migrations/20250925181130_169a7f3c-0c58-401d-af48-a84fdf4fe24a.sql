-- Add public access policy for job listings
-- This allows anyone (including unauthenticated users) to view active job listings
CREATE POLICY "Public can view active job listings" 
ON public.job_listings 
FOR SELECT 
USING (status = 'active');