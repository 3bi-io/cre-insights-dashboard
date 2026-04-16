CREATE OR REPLACE VIEW public.public_client_info AS
SELECT DISTINCT ON (c.id)
  c.id,
  c.name,
  c.logo_url,
  c.city,
  c.state,
  (SELECT count(*)::integer
   FROM job_listings jl2
   WHERE jl2.client_id = c.id
     AND jl2.status = 'active'
     AND (jl2.is_hidden = false OR jl2.is_hidden IS NULL)
  ) AS job_count,
  o.industry_vertical
FROM clients c
JOIN organizations o ON c.organization_id = o.id
WHERE c.status = 'active'
  AND o.slug <> 'acme'
ORDER BY c.id;