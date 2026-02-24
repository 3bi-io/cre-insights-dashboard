-- Fix Hub Group job listings: set organization_id from client's organization
UPDATE job_listings 
SET organization_id = c.organization_id
FROM clients c
WHERE job_listings.client_id = c.id
AND job_listings.organization_id IS NULL
AND c.organization_id IS NOT NULL;