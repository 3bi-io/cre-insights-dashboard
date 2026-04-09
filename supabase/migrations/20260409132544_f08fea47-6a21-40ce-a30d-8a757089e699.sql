UPDATE applications
SET source = raw_payload->>'source'
WHERE job_listing_id IN (
  SELECT id FROM job_listings WHERE client_id = 'be8b645e-d480-4c22-8e75-b09a7fc1db7a'
)
AND source = 'hayes-re-garrison-inbound'
AND raw_payload->>'source' IS NOT NULL
AND raw_payload->>'source' != '';