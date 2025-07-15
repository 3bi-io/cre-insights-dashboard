
-- Rename the description column to job_summary
ALTER TABLE public.job_listings 
RENAME COLUMN description TO job_summary;

-- Add the new columns
ALTER TABLE public.job_listings 
ADD COLUMN IF NOT EXISTS job_type TEXT,
ADD COLUMN IF NOT EXISTS apply_url TEXT;

-- Note: location column already exists in the table, so no need to add it again
