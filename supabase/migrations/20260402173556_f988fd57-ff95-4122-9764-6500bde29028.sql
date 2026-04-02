
ALTER TABLE job_listings DISABLE TRIGGER USER;

UPDATE job_listings
SET title = 'CDL-A Drivers: Top Tier Lease Purchase Program! $0 Down, No Credit Check! | ' || state,
    updated_at = now()
WHERE client_id = 'be8b645e-d480-4c22-8e75-b09a7fc1db7a'
  AND title LIKE 'Job %'
  AND state IS NOT NULL;

UPDATE job_listings
SET title = 'CDL-A Drivers: Top Tier Lease Purchase Program! $0 Down, No Credit Check!',
    updated_at = now()
WHERE client_id = 'be8b645e-d480-4c22-8e75-b09a7fc1db7a'
  AND title LIKE 'Job %'
  AND state IS NULL;

ALTER TABLE job_listings ENABLE TRIGGER USER;
