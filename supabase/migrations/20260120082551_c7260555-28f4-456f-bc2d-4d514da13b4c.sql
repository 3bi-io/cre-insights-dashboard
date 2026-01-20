-- Drop and recreate public_client_info view with additional fields
DROP VIEW IF EXISTS public.public_client_info;

CREATE VIEW public.public_client_info
WITH (security_invoker = false)
AS
SELECT DISTINCT ON (c.id)
  c.id,
  c.name,
  c.logo_url,
  c.city,
  c.state,
  (SELECT COUNT(*) FROM job_listings jl2 WHERE jl2.client_id = c.id AND jl2.status = 'active')::integer as job_count
FROM clients c
INNER JOIN job_listings jl ON jl.client_id = c.id
INNER JOIN organizations o ON c.organization_id = o.id
WHERE jl.status = 'active'
  AND c.status = 'active'
  AND o.slug != 'acme';

-- Grant access to anonymous and authenticated users
GRANT SELECT ON public.public_client_info TO anon, authenticated;