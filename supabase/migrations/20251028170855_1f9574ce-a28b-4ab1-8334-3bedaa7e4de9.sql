
-- Fix applications linked to General Application when matching job listings exist
UPDATE applications a
SET job_listing_id = jl.id,
    updated_at = now()
FROM job_listings jl
WHERE a.job_id IS NOT NULL
  AND a.job_id != ''
  AND jl.job_id = a.job_id
  AND jl.organization_id = '84214b48-7b51-45bc-ad7f-723bcf50466c'
  AND a.job_listing_id IN (
    SELECT id FROM job_listings 
    WHERE organization_id = '84214b48-7b51-45bc-ad7f-723bcf50466c'
      AND title = 'General Application'
  );
