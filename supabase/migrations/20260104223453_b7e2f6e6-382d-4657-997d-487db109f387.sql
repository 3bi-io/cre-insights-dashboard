-- Allow public users to view organizations that have active job listings
CREATE POLICY "Public can view organizations with active jobs"
ON organizations
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM job_listings jl
    WHERE jl.organization_id = organizations.id
    AND jl.status = 'active'
  )
);

-- Allow public users to view voice agents for organizations with active jobs
-- This enables the "Apply with Voice" feature for public visitors
CREATE POLICY "Public can view voice agents for active jobs"
ON voice_agents
FOR SELECT
TO public
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM job_listings jl
    WHERE jl.organization_id = voice_agents.organization_id
    AND jl.status = 'active'
  )
);