
-- Step 1: Create a General Application job listing for Hayes Recruiting Solutions / Pemberton
INSERT INTO job_listings (
  title, 
  organization_id, 
  client_id,
  category_id, 
  status, 
  job_summary,
  user_id
)
VALUES (
  'General Application - Pemberton Truck Lines',
  '84214b48-7b51-45bc-ad7f-723bcf50466c', -- Hayes Recruiting Solutions
  '67cadf11-8cce-41c6-8e19-7d2bb0be3b03', -- Pemberton Truck Lines Inc
  '61bd5f79-b3c1-4804-a6a0-d568773c3d84', -- Category
  'active',
  'General applications for CDL driver positions at Pemberton Truck Lines. Applications received via CDL Job Cast integration.',
  '86b642cb-af7b-47df-9bd6-179db1ae7c95'  -- Hayes user
);

-- Step 2: Update all misrouted CDL Job Cast applications to point to the new General Application
UPDATE applications 
SET 
  job_listing_id = (
    SELECT id FROM job_listings 
    WHERE organization_id = '84214b48-7b51-45bc-ad7f-723bcf50466c'
    AND title = 'General Application - Pemberton Truck Lines'
    LIMIT 1
  ),
  source = 'CDL Job Cast',
  updated_at = now()
WHERE job_listing_id IN (
  SELECT jl.id FROM job_listings jl
  JOIN organizations o ON jl.organization_id = o.id
  WHERE o.name = 'CR England'
)
AND (job_id LIKE '14294%' OR job_id LIKE '14204%' OR job_id LIKE '13980%');
