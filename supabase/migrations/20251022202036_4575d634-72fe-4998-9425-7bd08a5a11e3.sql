-- Update foreign key constraint to use CASCADE instead of SET NULL
-- This ensures when a job listing is deleted, all its applications are also removed
-- (orphaned applications without job listings don't make business sense)

ALTER TABLE public.applications
DROP CONSTRAINT IF EXISTS applications_job_listing_id_fkey;

ALTER TABLE public.applications
ADD CONSTRAINT applications_job_listing_id_fkey
FOREIGN KEY (job_listing_id) 
REFERENCES public.job_listings(id) 
ON DELETE CASCADE;

-- Add index for better query performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_applications_job_listing_id 
ON public.applications(job_listing_id);