-- Step 1: Delete duplicate job listings created by previous migration
DELETE FROM job_listings 
WHERE id IN (
  '7e76b269-617d-42f4-a447-1111ca7c31a4',
  '87b1a0f3-77e4-42fc-9742-c789c2fdf470',
  'baee8ffb-3065-4ed5-8c65-b03a615b7cfd'
);

-- Step 2: Delete duplicate clients created by previous migration
DELETE FROM clients 
WHERE id IN (
  'afcef289-519d-4321-9efb-b509d635779f',
  '478ace46-a467-4d65-9ace-f1c8fe29314e',
  '57a0ae5b-234e-43e0-b863-77de46319c3f'
);

-- Step 3: Update original clients with CDL Job Cast authentication keys
UPDATE clients
SET 
  notes = 'CDL Job Cast webhook routing enabled. Auth Key: WJxboyNegw',
  updated_at = NOW()
WHERE id = '4a9ef1df-dcc9-499c-999a-446bb9a329fc';

UPDATE clients
SET 
  notes = 'CDL Job Cast webhook routing enabled. Auth Key: KGRb4L0bBL',
  updated_at = NOW()
WHERE id = '67cadf11-8cce-41c6-8e19-7d2bb0be3b03';

UPDATE clients
SET 
  notes = 'CDL Job Cast webhook routing enabled. Auth Key: rlNbWqXeyg',
  updated_at = NOW()
WHERE id = '30ab5f68-258c-4e81-8217-1123c4536259';