-- Remove public access to voice agents
DROP POLICY IF EXISTS "Public can view active voice agents" ON voice_agents;

-- Remove generic user access policy (too permissive)
DROP POLICY IF EXISTS "Users can view voice agents in their org" ON voice_agents;

-- Ensure only organization admins and super admins can view voice agents
CREATE POLICY "Org admins can view their org voice agents"
ON voice_agents
FOR SELECT
TO authenticated
USING (
  is_super_admin(auth.uid()) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND organization_id = get_user_organization_id())
);

-- Keep existing management policies (they're already secure)
-- "Admins can manage voice agents in their org" - Already exists and is correct
-- "Super admins can manage all voice agents" - Already exists and is correct