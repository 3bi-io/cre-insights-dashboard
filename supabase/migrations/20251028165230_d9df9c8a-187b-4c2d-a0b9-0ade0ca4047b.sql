-- Drop the duplicate foreign key constraint
-- Keep fk_job_listings_client_id which has proper ON DELETE SET NULL behavior
ALTER TABLE job_listings 
DROP CONSTRAINT IF EXISTS job_listings_client_id_fkey;