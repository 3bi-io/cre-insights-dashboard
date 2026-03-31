
-- Disable Google indexing triggers
ALTER TABLE job_listings DISABLE TRIGGER trg_google_indexing_notify;
ALTER TABLE job_listings DISABLE TRIGGER trigger_google_indexing_on_job_change;

-- Update listings with state suffix
UPDATE job_listings 
SET title = 'CDL-A Drivers: Top Tier Lease Purchase Program! $0 Down, No Credit Check! |' || substring(title from '\|(.+)$'),
    updated_at = now()
WHERE organization_id = '84214b48-7b51-45bc-ad7f-723bcf50466c' 
  AND title ILIKE '%Solo Owner Operator%'
  AND title LIKE '%|%';

-- Update listings without state suffix
UPDATE job_listings 
SET title = 'CDL-A Drivers: Top Tier Lease Purchase Program! $0 Down, No Credit Check!',
    updated_at = now()
WHERE organization_id = '84214b48-7b51-45bc-ad7f-723bcf50466c' 
  AND title ILIKE '%Solo Owner Operator%'
  AND title NOT LIKE '%|%';

-- Re-enable triggers
ALTER TABLE job_listings ENABLE TRIGGER trg_google_indexing_notify;
ALTER TABLE job_listings ENABLE TRIGGER trigger_google_indexing_on_job_change;
