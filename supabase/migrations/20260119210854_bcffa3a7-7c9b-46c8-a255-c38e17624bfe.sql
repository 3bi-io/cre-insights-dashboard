-- Update all Hayes org Tenstreet connections to use 'NationalTruckinNetwork' as source
UPDATE ats_connections 
SET credentials = credentials || '{"source": "NationalTruckinNetwork"}'::jsonb,
    updated_at = now()
WHERE organization_id = '84214b48-7b51-45bc-ad7f-723bcf50466c';