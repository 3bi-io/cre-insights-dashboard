
-- Fix orphaned applications by linking them to General Application jobs

DO $$
DECLARE
  org_id uuid;
  org_user_id uuid;
  fallback_job_id uuid;
  category_id uuid;
BEGIN
  -- Get the first available category
  SELECT id INTO category_id FROM job_categories LIMIT 1;
  
  -- For Hayes Recruiting Solutions
  org_id := '84214b48-7b51-45bc-ad7f-723bcf50466c';
  org_user_id := '04079080-7ca2-48a4-8bdb-a880dc669aa5';
  
  -- Check if General Application job exists for this org
  SELECT id INTO fallback_job_id 
  FROM job_listings 
  WHERE organization_id = org_id 
    AND title = 'General Application'
  LIMIT 1;
  
  -- Create General Application job if it doesn't exist
  IF fallback_job_id IS NULL AND category_id IS NOT NULL THEN
    INSERT INTO job_listings (
      title,
      organization_id,
      user_id,
      category_id,
      status,
      job_summary
    )
    VALUES (
      'General Application',
      org_id,
      org_user_id,
      category_id,
      'active',
      'General application submissions without specific job match'
    )
    RETURNING id INTO fallback_job_id;
    
    RAISE NOTICE 'Created General Application job: %', fallback_job_id;
  END IF;
  
  -- Update orphaned applications to use the fallback job
  IF fallback_job_id IS NOT NULL THEN
    UPDATE applications
    SET job_listing_id = fallback_job_id,
        updated_at = now()
    WHERE job_listing_id IS NULL;
      
    RAISE NOTICE 'Fixed orphaned applications for organization %', org_id;
  END IF;
END $$;
