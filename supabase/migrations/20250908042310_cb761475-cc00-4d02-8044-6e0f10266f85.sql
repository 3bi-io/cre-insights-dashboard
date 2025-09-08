-- Update RLS policies for voice_agents table to ensure super admins can see all data

-- Drop existing restrictive policies and create proper ones for super admins
DROP POLICY IF EXISTS "Users can view their own voice agents" ON public.voice_agents;
DROP POLICY IF EXISTS "Users can update their own voice agents" ON public.voice_agents;
DROP POLICY IF EXISTS "Users can delete their own voice agents" ON public.voice_agents;
DROP POLICY IF EXISTS "Users can create their own voice agents" ON public.voice_agents;

-- Create comprehensive policies for super admins and regular users
CREATE POLICY "Super admins can manage all voice agents" 
ON public.voice_agents 
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Org admins can manage voice agents in their org" 
ON public.voice_agents 
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
);

CREATE POLICY "Users can view voice agents in their org" 
ON public.voice_agents 
FOR SELECT
USING (organization_id = get_user_organization_id());