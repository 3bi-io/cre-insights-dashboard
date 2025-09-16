-- Associate all existing applications with their correct job listings
-- by matching the job_id field to job_listings.job_id
UPDATE applications 
SET job_listing_id = jl.id 
FROM job_listings jl 
WHERE applications.job_id = jl.job_id 
  AND applications.job_listing_id IS NULL;

-- Ensure all job listings are associated with CR England organization
UPDATE job_listings 
SET organization_id = '682af95c-e95a-4e21-8753-ddef7f8c1749' 
WHERE organization_id IS NULL;

-- Add index for better performance on job_id lookups
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_job_id ON job_listings(job_id);