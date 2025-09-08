-- Fix applications data integrity by linking them to correct job listings
-- Update applications.job_listing_id based on matching job_id values

UPDATE applications 
SET job_listing_id = jl.id
FROM job_listings jl
WHERE applications.job_id = jl.job_id 
  AND applications.job_listing_id IS NULL
  AND jl.organization_id = '682af95c-e95a-4e21-8753-ddef7f8c1749';

-- Verify the fix worked
-- This should now return the count of applications properly linked to CR England jobs
-- Expected result: 366 applications linked to CR England job listings