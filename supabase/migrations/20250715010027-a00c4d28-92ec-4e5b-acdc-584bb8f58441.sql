
-- Update the RLS policy to allow all authenticated users to view applications
DROP POLICY IF EXISTS "Users can view applications for their job listings" ON public.applications;

CREATE POLICY "All authenticated users can view applications" 
  ON public.applications 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Keep the existing policies for INSERT, UPDATE so users can only modify applications for their own job listings
-- These policies remain unchanged:
-- "Users can create applications for their job listings" (INSERT)
-- "Users can update applications for their job listings" (UPDATE)
