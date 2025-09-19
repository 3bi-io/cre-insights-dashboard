-- Associate existing applications with CR England organization
DO $$
DECLARE
  v_org_id uuid;
  v_job_listing_id uuid;
  v_category_id uuid;
  v_applications_count integer;
BEGIN
  -- Get CR England organization ID
  SELECT id INTO v_org_id FROM public.organizations WHERE slug = 'cr-england' LIMIT 1;
  
  -- If CR England doesn't exist, create it
  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations (name, slug, subscription_status)
    VALUES ('CR England', 'cr-england', 'active')
    RETURNING id INTO v_org_id;
  END IF;

  -- Get a default job category (create one if none exists)
  SELECT id INTO v_category_id FROM public.job_categories LIMIT 1;
  IF v_category_id IS NULL THEN
    INSERT INTO public.job_categories (name, description)
    VALUES ('General', 'General job category')
    RETURNING id INTO v_category_id;
  END IF;
  
  -- Check if there's already a default job listing for CR England
  SELECT id INTO v_job_listing_id 
  FROM public.job_listings 
  WHERE organization_id = v_org_id 
    AND title = 'Default Application Listing' 
  LIMIT 1;
  
  -- Create a default job listing for CR England if it doesn't exist
  IF v_job_listing_id IS NULL THEN
    INSERT INTO public.job_listings (
      title,
      job_summary,
      organization_id,
      category_id,
      user_id,
      location,
      status,
      created_at,
      updated_at
    )
    SELECT 
      'Default Application Listing',
      'Default job listing for migrated applications',
      v_org_id,
      v_category_id,
      p.id, -- Use the first admin user for CR England
      'Various Locations',
      'active',
      now(),
      now()
    FROM public.profiles p
    JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE p.organization_id = v_org_id 
      AND ur.role IN ('admin', 'super_admin')
    LIMIT 1
    RETURNING id INTO v_job_listing_id;
  END IF;
  
  -- If no admin user found, use super admin
  IF v_job_listing_id IS NULL THEN
    INSERT INTO public.job_listings (
      title,
      job_summary,
      organization_id,
      category_id,
      user_id,
      location,
      status,
      created_at,
      updated_at
    )
    SELECT 
      'Default Application Listing',
      'Default job listing for migrated applications',
      v_org_id,
      v_category_id,
      p.id,
      'Various Locations',
      'active',
      now(),
      now()
    FROM public.profiles p
    JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE ur.role = 'super_admin'
    LIMIT 1
    RETURNING id INTO v_job_listing_id;
  END IF;
  
  -- Count applications that need to be updated (those without job_listing_id or with invalid job_listing_id)
  SELECT COUNT(*) INTO v_applications_count
  FROM public.applications a
  WHERE a.job_listing_id IS NULL 
    OR NOT EXISTS (
      SELECT 1 FROM public.job_listings jl 
      WHERE jl.id = a.job_listing_id
    );
  
  -- Update applications to reference the CR England job listing
  UPDATE public.applications 
  SET 
    job_listing_id = v_job_listing_id,
    updated_at = now()
  WHERE job_listing_id IS NULL 
    OR NOT EXISTS (
      SELECT 1 FROM public.job_listings jl 
      WHERE jl.id = applications.job_listing_id
    );
  
  -- Log the results
  RAISE NOTICE 'Migration completed:';
  RAISE NOTICE '- CR England organization ID: %', v_org_id;
  RAISE NOTICE '- Default job listing ID: %', v_job_listing_id;
  RAISE NOTICE '- Applications updated: %', v_applications_count;
  
END $$;