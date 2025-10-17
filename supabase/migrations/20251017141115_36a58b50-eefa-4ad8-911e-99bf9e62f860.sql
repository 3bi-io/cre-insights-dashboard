-- Enable RLS on voice_agents table
ALTER TABLE voice_agents ENABLE ROW LEVEL SECURITY;

-- Allow users to view voice agents in their organization
CREATE POLICY "Users can view voice agents in their org"
ON voice_agents
FOR SELECT
USING (
  organization_id = get_user_organization_id()
  OR is_super_admin(auth.uid())
);

-- Allow super admins and org admins to manage voice agents
CREATE POLICY "Admins can manage voice agents in their org"
ON voice_agents
FOR ALL
USING (
  is_super_admin(auth.uid())
  OR (
    has_role(auth.uid(), 'admin'::app_role)
    AND organization_id = get_user_organization_id()
  )
);

-- Allow public access to active voice agents for public-facing features
CREATE POLICY "Public can view active voice agents"
ON voice_agents
FOR SELECT
USING (is_active = true);