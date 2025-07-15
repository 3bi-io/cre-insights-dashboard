
UPDATE public.job_listings 
SET location = 'remote' 
WHERE location IS NULL OR location = '';
