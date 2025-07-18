
-- Enable users to update platform configurations
DROP POLICY IF EXISTS "Anyone can view platforms" ON public.platforms;
DROP POLICY IF EXISTS "Users can update platforms" ON public.platforms;
DROP POLICY IF EXISTS "Users can create platforms" ON public.platforms;
DROP POLICY IF EXISTS "Users can delete platforms" ON public.platforms;

-- Create new policies for platform management
CREATE POLICY "Anyone can view platforms" 
  ON public.platforms 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can update platforms" 
  ON public.platforms 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create platforms" 
  ON public.platforms 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete platforms" 
  ON public.platforms 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);
