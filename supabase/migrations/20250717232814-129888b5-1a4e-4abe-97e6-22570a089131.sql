-- Remove the old platform_id column from job_listings table since we now use the junction table
ALTER TABLE public.job_listings DROP COLUMN IF EXISTS platform_id;