-- Create a public view for clients with active job listings
-- This exposes only safe data (id, name, logo_url) for clients that have public jobs
CREATE VIEW public.public_client_info
WITH (security_invoker = false)
AS
SELECT DISTINCT
  c.id,
  c.name,
  c.logo_url
FROM clients c
INNER JOIN job_listings jl ON jl.client_id = c.id
INNER JOIN organizations o ON c.organization_id = o.id
WHERE jl.status = 'active'
  AND c.status = 'active'
  AND o.slug != 'acme';

-- Grant SELECT permissions to public users
GRANT SELECT ON public.public_client_info TO anon, authenticated;