UPDATE applications
SET 
  needs_enrichment = true,
  enrichment_fields = ARRAY['exp', 'driving_experience_years', 'cdl_class', 'driver_type']
WHERE job_listing_id IN (
  SELECT id FROM job_listings WHERE client_id = 'be8b645e-d480-4c22-8e75-b09a7fc1db7a'
)
AND driving_experience_years IS NULL
AND exp IS NULL
AND source IN ('ZipRecruiter', 'TheTruckersReportJobs', 'Adzuna');