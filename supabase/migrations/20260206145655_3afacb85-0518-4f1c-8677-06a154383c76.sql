-- Rename client from "J Hayes" to "Hayes AI Recruiting"
UPDATE public.clients 
SET name = 'Hayes AI Recruiting', updated_at = now()
WHERE id = '49dce1cb-4830-440d-8835-6ce59b552012';

-- Update the job listing's client field to match
UPDATE public.job_listings 
SET client = 'Hayes AI Recruiting', updated_at = now()
WHERE client_id = '49dce1cb-4830-440d-8835-6ce59b552012';