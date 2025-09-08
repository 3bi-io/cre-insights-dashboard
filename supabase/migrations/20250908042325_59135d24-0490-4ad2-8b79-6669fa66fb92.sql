-- First check and drop the existing policy that's causing issues
DROP POLICY IF EXISTS "Admins can manage voice agents" ON public.voice_agents;

-- Now create the proper super admin policy if it doesn't exist
CREATE POLICY "Super admins can manage all voice agents" 
ON public.voice_agents 
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));