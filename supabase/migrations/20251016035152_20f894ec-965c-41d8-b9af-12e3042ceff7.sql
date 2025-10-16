-- Create example job group for ACME demo organization

DO $$
DECLARE
  acme_org_id UUID;
  demo_user_id UUID;
  campaign_id UUID;
  job_group_id UUID;
  job_ids UUID[];
BEGIN
  -- Get ACME organization ID
  SELECT id INTO acme_org_id 
  FROM public.organizations 
  WHERE slug = 'acme' 
  LIMIT 1;

  -- Get demo user ID from ACME org
  SELECT id INTO demo_user_id
  FROM public.profiles
  WHERE organization_id = acme_org_id
  LIMIT 1;

  -- If no user exists, use the first available user
  IF demo_user_id IS NULL THEN
    SELECT id INTO demo_user_id FROM public.profiles LIMIT 1;
  END IF;

  -- Create a campaign for the job group
  INSERT INTO public.campaigns (user_id, organization_id, name, description, status)
  VALUES (
    demo_user_id,
    acme_org_id,
    'Regional Driver Campaign - Q4 2025',
    'Targeted campaign for regional CDL drivers in the Western states',
    'active'
  )
  RETURNING id INTO campaign_id;

  -- Create the job group
  INSERT INTO public.job_groups (
    user_id, 
    organization_id, 
    campaign_id, 
    name, 
    description, 
    publisher_name,
    publisher_endpoint,
    status,
    xml_feed_settings
  )
  VALUES (
    demo_user_id,
    acme_org_id,
    campaign_id,
    'Western Regional CDL-A Routes',
    'Collection of premium regional routes for experienced CDL-A drivers in CA, NV, AZ, and UT. Features consistent home time and competitive pay packages.',
    'Indeed',
    'https://api.indeed.com/xml-feed',
    'active',
    jsonb_build_object(
      'format', 'xml',
      'frequency', 'daily',
      'auto_publish', true,
      'include_salary', true,
      'featured', true
    )
  )
  RETURNING id INTO job_group_id;

  -- Get some job IDs from ACME organization to assign to the group
  SELECT ARRAY(
    SELECT id FROM public.job_listings 
    WHERE organization_id = acme_org_id 
    LIMIT 5
  ) INTO job_ids;

  -- Create job group assignments
  INSERT INTO public.job_group_assignments (job_group_id, job_listing_id)
  SELECT job_group_id, unnest(job_ids);

  -- Log the results
  RAISE NOTICE 'Created job group: % with % jobs assigned', job_group_id, array_length(job_ids, 1);
END $$;