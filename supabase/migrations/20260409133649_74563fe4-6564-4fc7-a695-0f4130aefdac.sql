UPDATE applications
SET 
  exp = COALESCE(exp, 
    CASE WHEN raw_payload->>'months' IS NOT NULL THEN (raw_payload->>'months') || ' Months' END,
    CASE WHEN raw_payload->>'experience' IS NOT NULL THEN (raw_payload->>'experience') || ' months' END
  ),
  driving_experience_years = COALESCE(driving_experience_years,
    CASE WHEN raw_payload->>'months' IS NOT NULL THEN FLOOR((raw_payload->>'months')::int / 12)::int END,
    CASE WHEN raw_payload->>'experience' IS NOT NULL THEN FLOOR((raw_payload->>'experience')::int / 12)::int END
  )
WHERE job_listing_id IN (
  SELECT id FROM job_listings WHERE client_id = 'be8b645e-d480-4c22-8e75-b09a7fc1db7a'
)
AND exp IS NULL
AND (raw_payload->>'experience' IS NOT NULL OR raw_payload->>'months' IS NOT NULL);