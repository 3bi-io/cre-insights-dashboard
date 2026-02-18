
-- ONE-TIME DATA CLEANUP: Consolidate duplicate "General Application" fallback listings
-- This is a data operation, not a schema change.

-- Step 1: Reassign Pemberton apps to oldest listing
UPDATE public.applications 
SET job_listing_id = '9ffccf6e-0772-44c3-8864-fa26cbc98f2a'
WHERE job_listing_id IN (
  SELECT id FROM public.job_listings 
  WHERE title = 'General Application' 
    AND organization_id = '84214b48-7b51-45bc-ad7f-723bcf50466c'
    AND client_id = '67cadf11-8cce-41c6-8e19-7d2bb0be3b03'
    AND id != '9ffccf6e-0772-44c3-8864-fa26cbc98f2a'
);

-- Step 2: Reassign Danny Herman apps to oldest listing
UPDATE public.applications 
SET job_listing_id = '14f6b0c7-8822-49ff-925f-5d05378f8f96'
WHERE job_listing_id IN (
  SELECT id FROM public.job_listings 
  WHERE title = 'General Application' 
    AND organization_id = '84214b48-7b51-45bc-ad7f-723bcf50466c'
    AND client_id = '1d54e463-4d7f-4a05-8189-3e33d0586dea'
    AND id != '14f6b0c7-8822-49ff-925f-5d05378f8f96'
);

-- Step 3: Reassign Day and Ross apps to oldest listing
UPDATE public.applications 
SET job_listing_id = 'a86e688a-29af-442e-9026-b1ff4c755ef4'
WHERE job_listing_id IN (
  SELECT id FROM public.job_listings 
  WHERE title = 'General Application' 
    AND organization_id = '84214b48-7b51-45bc-ad7f-723bcf50466c'
    AND client_id = '30ab5f68-258c-4e81-8217-1123c4536259'
    AND id != 'a86e688a-29af-442e-9026-b1ff4c755ef4'
);

-- Step 4: Delete ALL General Application listings except the 4 keepers
DELETE FROM public.job_listings
WHERE title = 'General Application'
  AND organization_id = '84214b48-7b51-45bc-ad7f-723bcf50466c'
  AND id NOT IN (
    '9ffccf6e-0772-44c3-8864-fa26cbc98f2a',  -- Pemberton
    '14f6b0c7-8822-49ff-925f-5d05378f8f96',  -- Danny Herman
    'a86e688a-29af-442e-9026-b1ff4c755ef4',  -- Day and Ross
    '71711702-36b8-4d1a-b9e8-61e0556b166b'   -- James Burg
  );
