CREATE OR REPLACE VIEW public.public_client_info
WITH (security_invoker = false) AS
SELECT DISTINCT ON (c.id)
    c.id,
    c.name,
    c.logo_url,
    c.city,
    c.state,
    (
        SELECT count(*)
        FROM job_listings jl2
        WHERE jl2.client_id = c.id
          AND jl2.status = 'active'
          AND (jl2.is_hidden = false OR jl2.is_hidden IS NULL)
    )::integer AS job_count
FROM clients c
JOIN job_listings jl ON jl.client_id = c.id
JOIN organizations o ON c.organization_id = o.id
WHERE jl.status = 'active'
  AND (jl.is_hidden = false OR jl.is_hidden IS NULL)
  AND c.status = 'active'
  AND o.slug <> 'acme';