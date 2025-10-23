
-- Update all job listings for C.R. England to active status
UPDATE job_listings 
SET status = 'active' 
WHERE organization_id = 'abc58122-b809-4fb3-8e32-dfc25f21379c' 
  AND status != 'active';
