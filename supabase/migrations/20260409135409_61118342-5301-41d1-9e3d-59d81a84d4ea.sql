UPDATE applications
SET driving_experience_years = CASE
  WHEN exp ~* '(\d+)\+?\s*years?' THEN (regexp_match(exp, '(\d+)\+?\s*years?', 'i'))[1]::int
  WHEN exp ~* '(\d+)\+?\s*months?' THEN FLOOR((regexp_match(exp, '(\d+)\+?\s*months?', 'i'))[1]::int / 12)::int
  ELSE driving_experience_years
END
WHERE job_listing_id IN (
  SELECT id FROM job_listings WHERE client_id = 'be8b645e-d480-4c22-8e75-b09a7fc1db7a'
)
AND exp IS NOT NULL
AND (driving_experience_years IS NULL OR driving_experience_years = 0);