SET session_replication_role = 'replica';

DELETE FROM job_listings 
WHERE client_id IN (
  '8ca3faca-b91c-4ab8-a9af-b145ab265228',
  'feb3479f-4116-42a5-bb6a-811406c1c99a',
  '50657f4d-c47b-4104-a307-b82d5fa4a1df'
);

SET session_replication_role = 'origin';