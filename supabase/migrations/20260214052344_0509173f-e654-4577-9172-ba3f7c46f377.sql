UPDATE public.ats_connections 
SET credentials = jsonb_set(credentials, '{source}', '"NationalTruckinNetwork"'),
    updated_at = now()
WHERE id = '89b01bd3-2533-47ad-89ea-196c12f5c136';
