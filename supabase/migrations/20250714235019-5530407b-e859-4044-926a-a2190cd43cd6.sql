
-- First, let's see what job listings exist to understand the data structure
SELECT id, job_id, title, client, description 
FROM public.job_listings 
WHERE job_id IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 10;

-- If job_id 328 doesn't exist, let's see if we can find the record by other means
SELECT id, job_id, title, client 
FROM public.job_listings 
WHERE title ILIKE '%CDL%' OR title ILIKE '%driver%' OR client ILIKE '%driver%'
ORDER BY created_at DESC;
