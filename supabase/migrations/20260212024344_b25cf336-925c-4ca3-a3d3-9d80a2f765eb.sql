
-- Reassign existing CR England job listings with prefixes 14380, 14382, 14383 from Unassigned to Dollar Tree
UPDATE job_listings 
SET client_id = '853d514a-bfe7-44f8-a02a-3f0b10e9642d',
    updated_at = now()
WHERE organization_id = '682af95c-e95a-4e21-8753-ddef7f8c1749'
  AND client_id = '8399d1b6-a294-448f-91cf-a90755f151e3'
  AND (job_id LIKE '14380%' OR job_id LIKE '14382%' OR job_id LIKE '14383%');
