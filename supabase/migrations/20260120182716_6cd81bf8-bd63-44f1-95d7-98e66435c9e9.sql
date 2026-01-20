-- Step 1: Create General Application job listings for Danny Herman, Day and Ross, and Novco
INSERT INTO job_listings (title, organization_id, client_id, category_id, status, job_summary, user_id)
VALUES
  ('General Application - Danny Herman Trucking', '84214b48-7b51-45bc-ad7f-723bcf50466c', 
   '1d54e463-4d7f-4a05-8189-3e33d0586dea', '61bd5f79-b3c1-4804-a6a0-d568773c3d84', 'active',
   'General applications for CDL driver positions at Danny Herman Trucking. Applications received via CDL Job Cast integration.',
   '86b642cb-af7b-47df-9bd6-179db1ae7c95'),
  ('General Application - Day and Ross', '84214b48-7b51-45bc-ad7f-723bcf50466c',
   '30ab5f68-258c-4e81-8217-1123c4536259', '61bd5f79-b3c1-4804-a6a0-d568773c3d84', 'active',
   'General applications for CDL driver positions at Day and Ross. Applications received via CDL Job Cast integration.',
   '86b642cb-af7b-47df-9bd6-179db1ae7c95'),
  ('General Application - Novco, Inc.', '84214b48-7b51-45bc-ad7f-723bcf50466c',
   '4a9ef1df-dcc9-499c-999a-446bb9a329fc', '61bd5f79-b3c1-4804-a6a0-d568773c3d84', 'active',
   'General applications for CDL driver positions at Novco, Inc. Applications received via CDL Job Cast integration.',
   '86b642cb-af7b-47df-9bd6-179db1ae7c95');

-- Step 2: Reassign misrouted Danny Herman applications (job_id prefixes 13979, 13980, 14204)
UPDATE applications 
SET 
  job_listing_id = (
    SELECT id FROM job_listings 
    WHERE organization_id = '84214b48-7b51-45bc-ad7f-723bcf50466c'
    AND title = 'General Application - Danny Herman Trucking'
    LIMIT 1
  ),
  updated_at = now()
WHERE source = 'CDL Job Cast'
  AND (job_id LIKE '13979%' OR job_id LIKE '13980%' OR job_id LIKE '14204%');