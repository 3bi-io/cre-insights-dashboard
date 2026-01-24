-- Hide all "General Application" job listings from public pages
UPDATE job_listings
SET is_hidden = true, updated_at = now()
WHERE title = 'General Application' AND is_hidden = false;

-- Hide all job listings linked to "Unassigned" clients from public pages
UPDATE job_listings jl
SET is_hidden = true, updated_at = now()
FROM clients c
WHERE jl.client_id = c.id 
  AND c.name = 'Unassigned'
  AND jl.is_hidden = false;