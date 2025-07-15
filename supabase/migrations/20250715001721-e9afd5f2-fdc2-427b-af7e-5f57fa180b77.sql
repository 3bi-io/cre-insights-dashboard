
UPDATE public.job_listings 
SET job_type = 'Full-Time' 
WHERE job_type IS NULL OR job_type = '';
