
-- Add new columns to job_listings table
ALTER TABLE public.job_listings 
ADD COLUMN client TEXT,
ADD COLUMN radius INTEGER,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT,
ADD COLUMN salary_min DECIMAL(10,2),
ADD COLUMN salary_max DECIMAL(10,2),
ADD COLUMN job_id TEXT,
ADD COLUMN dest_city TEXT,
ADD COLUMN dest_state TEXT,
ADD COLUMN job_title TEXT,
ADD COLUMN job_description TEXT,
ADD COLUMN salary_type TEXT CHECK (salary_type IN ('hourly', 'yearly', 'weekly', 'daily', 'contract')),
ADD COLUMN url TEXT;

-- Add index on job_id for better performance if it will be used for lookups
CREATE INDEX IF NOT EXISTS idx_job_listings_job_id ON public.job_listings(job_id);

-- Add index on salary range for filtering
CREATE INDEX IF NOT EXISTS idx_job_listings_salary ON public.job_listings(salary_min, salary_max);
