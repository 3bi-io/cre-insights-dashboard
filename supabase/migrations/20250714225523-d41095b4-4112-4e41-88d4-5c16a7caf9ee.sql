
-- Update the RLS policy to allow all authenticated users to view job listings
DROP POLICY IF EXISTS "Users can view their own job listings" ON public.job_listings;

CREATE POLICY "All authenticated users can view job listings" 
  ON public.job_listings 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Keep the existing policies for INSERT, UPDATE, DELETE so users can only modify their own listings
-- These policies remain unchanged:
-- "Users can create their own job listings" (INSERT)
-- "Users can update their own job listings" (UPDATE) 
-- "Users can delete their own job listings" (DELETE)
