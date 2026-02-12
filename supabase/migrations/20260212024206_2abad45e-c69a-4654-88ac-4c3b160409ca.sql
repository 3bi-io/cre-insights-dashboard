
-- Reassign TN applicants (Kenneth Grayson, Rick Bledsoe) to Dollar Tree Memphis listing
UPDATE applications 
SET job_listing_id = 'b0ce4b86-e86e-4755-99ad-de141238e075',
    notes = COALESCE(notes || E'\n', '') || '[Admin] Reassigned from Unassigned to Dollar Tree (Memphis, TN) - ' || now()::text
WHERE id IN (
  '965ea544-218e-4014-ba6e-af3bdce7d375',
  'b28dc49a-06b3-4683-813d-7df595bf9cb3'
);

-- Reassign TX applicants (Lawson Towne, Vicente Bernal, Leon Johnson) to Dollar Tree Joilet listing (closest general)
UPDATE applications 
SET job_listing_id = '39a6054f-b90e-4852-9cc9-0e7c12a9c2e5',
    notes = COALESCE(notes || E'\n', '') || '[Admin] Reassigned from Unassigned to Dollar Tree (Joliet, IL - nearest general) - ' || now()::text
WHERE id IN (
  '05d46e35-4e7d-45fa-8c13-915d90fc287b',
  'bb340436-9155-4960-bfd5-204943e9ef31',
  '99e0920a-32da-4bab-9546-7652fe4c302f'
);

-- Delete 18 orphaned ElevenLabs test entries with null job_listing_id
DELETE FROM applications 
WHERE job_listing_id IS NULL 
AND id IN (
  '205e782f-658c-4fb9-b791-faa88d98fc27',
  '04082a19-639c-4fcc-a15b-be2f76c52d0c',
  'aef22a8e-bd44-4629-9e43-a978c9286de3',
  'd1b8522a-ab92-44d0-aadd-520deeb1850f',
  '3c725d12-9d44-4f04-8344-dfd55ad478c3',
  '0d38166f-845a-47ea-9257-ada5e6b09bae',
  '810717db-106d-4052-8b8f-94fd95acfa58',
  '670db5cd-1e60-4fab-b349-4b60923f6832',
  '73d9f334-32bc-422e-add6-1954e831dc24',
  'a1943824-fafb-4fc0-ad4d-e3c2d8fb7957',
  '015ef14e-3d94-4816-9b24-c03b0edc86d0',
  'c553c625-b668-463a-8690-d203451738b6',
  '4fcf270a-9e01-4808-ac29-583cc10e7bcd',
  'ce72690a-cca4-4d17-afd8-1240474b3e21',
  '5f8020aa-c920-4124-a9cb-2ef075bfe8a3',
  'b34af8d1-886d-484d-8135-5fc46f6ede3a',
  '262fb76b-5528-4cac-b493-53b9c43369a5',
  '9d687411-8778-4ebc-bb64-4c6b92cf776f'
);
