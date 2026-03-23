ALTER TABLE public.job_listings 
ADD COLUMN IF NOT EXISTS min_experience_months integer DEFAULT NULL;

UPDATE public.job_listings 
SET min_experience_months = 6 
WHERE client_id IN (
  SELECT id FROM clients WHERE name ILIKE '%pemberton%'
);