
-- Create missing job listings from application job_ids for Hayes Recruiting Solutions
DO $$
DECLARE
  org_id uuid := '84214b48-7b51-45bc-ad7f-723bcf50466c';
  org_user_id uuid := '04079080-7ca2-48a4-8bdb-a880dc669aa5';
  category_id uuid;
  job_rec RECORD;
  new_job_id uuid;
BEGIN
  -- Get default category
  SELECT id INTO category_id FROM job_categories LIMIT 1;
  
  IF category_id IS NULL THEN
    RAISE NOTICE 'No job category found, skipping migration';
    RETURN;
  END IF;

  -- Loop through unique job_ids from applications that don't have matching job listings
  FOR job_rec IN 
    SELECT DISTINCT 
      a.job_id,
      COUNT(*) as app_count,
      MAX(a.applied_at) as latest_application
    FROM applications a
    JOIN job_listings jl ON a.job_listing_id = jl.id
    WHERE jl.organization_id = org_id
      AND a.job_id IS NOT NULL
      AND a.job_id != ''
      AND NOT EXISTS (
        SELECT 1 FROM job_listings jl2 
        WHERE jl2.organization_id = org_id 
          AND jl2.job_id = a.job_id
      )
    GROUP BY a.job_id
  LOOP
    -- Create job listing with the external job_id
    INSERT INTO job_listings (
      title,
      job_id,
      organization_id,
      user_id,
      category_id,
      status,
      job_summary
    )
    VALUES (
      'Position ' || job_rec.job_id,
      job_rec.job_id,
      org_id,
      org_user_id,
      category_id,
      'active',
      'Auto-created from ' || job_rec.app_count || ' applications'
    )
    RETURNING id INTO new_job_id;
    
    -- Update all applications with this job_id to point to the new job listing
    UPDATE applications
    SET job_listing_id = new_job_id,
        updated_at = now()
    WHERE job_id = job_rec.job_id
      AND EXISTS (
        SELECT 1 FROM job_listings jl
        WHERE jl.id = applications.job_listing_id
          AND jl.organization_id = org_id
      );
    
    RAISE NOTICE 'Created job listing % for job_id % with % applications', 
      new_job_id, job_rec.job_id, job_rec.app_count;
  END LOOP;
END $$;
