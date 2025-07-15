
UPDATE public.job_listings 
SET apply_url = 'https://3bi.io/elevenlabs/' 
WHERE apply_url IS NULL OR apply_url = '';
