-- Update RLS policy to allow public access to job listings
DROP POLICY IF EXISTS "All authenticated users can view job listings" ON public.job_listings;

-- Create new policy that allows everyone to view job listings
CREATE POLICY "Everyone can view job listings" 
ON public.job_listings 
FOR SELECT 
USING (true);