-- Temporarily disable google indexing triggers
ALTER TABLE public.job_listings DISABLE TRIGGER trg_google_indexing_notify;
ALTER TABLE public.job_listings DISABLE TRIGGER trigger_google_indexing_on_job_change;

-- 1. Delete 8 junk test applications
DELETE FROM public.applications WHERE id IN (
  '388a9c52-19bd-4259-9b18-acb3527c55b8',
  '42cf87f6-4d4b-49ba-8d24-70af3b9c717b',
  'e72dc8ec-aa7d-4c1a-b053-ee816dc1d1d0',
  '5fba8b48-cfb5-458f-b1b8-e36cb7daa382',
  '1765d955-b93a-45d7-a73f-27404092b0ec',
  '77b908ab-f20f-48b3-ac77-d116244fec81',
  '4746db08-4d4d-4fde-866b-3bdf40a30775',
  'd222a334-18ee-442c-b321-2ec8ba318aa8'
);

-- 2. Mark junk job listing as completed
UPDATE public.job_listings SET status = 'completed', updated_at = now() WHERE id = 'c33d4bb5-f99e-42bd-affa-43d8fbf621d4';

-- 3. Normalize state values
UPDATE public.job_listings SET state = 'NY', location = regexp_replace(location, 'New York', 'NY'), updated_at = now() WHERE id = '2950430d-0654-46ef-8319-4576e7b264eb';
UPDATE public.job_listings SET state = 'TX', location = regexp_replace(location, 'Texas', 'TX'), updated_at = now() WHERE id = 'cbcdb5bb-f995-428d-8b1a-e6c1f1c739e2';

-- 4. Apply canonical titles
UPDATE public.job_listings SET title = 'CDL-A Drivers: Top Tier Lease Purchase Program! $0 Down, No Credit Check! | Arkansas', updated_at = now() WHERE id = '89fd4e20-4996-4244-a872-3c930a50e638';
UPDATE public.job_listings SET title = 'CDL-A Drivers: Top Tier Lease Purchase Program! $0 Down, No Credit Check! | Arizona', updated_at = now() WHERE id IN ('fa51749d-8962-44e4-9b03-f074dfc4f1a2', '45e50289-ceef-4799-867f-06085ef08164');
UPDATE public.job_listings SET title = 'CDL-A Drivers: Top Tier Lease Purchase Program! $0 Down, No Credit Check! | Iowa', updated_at = now() WHERE id = '24a0aff0-18dc-4e31-af4a-27c217f4bfda';
UPDATE public.job_listings SET title = 'CDL-A Drivers: Top Tier Lease Purchase Program! $0 Down, No Credit Check! | Mississippi', updated_at = now() WHERE id = '35a72957-b5b6-4483-82e8-e051da079b6b';
UPDATE public.job_listings SET title = 'CDL-A Drivers: Top Tier Lease Purchase Program! $0 Down, No Credit Check! | Nebraska', updated_at = now() WHERE id = 'f2abed10-83b3-420b-8b80-b9f25c7eaf12';
UPDATE public.job_listings SET title = 'CDL-A Drivers: Top Tier Lease Purchase Program! $0 Down, No Credit Check! | New York', updated_at = now() WHERE id = '2950430d-0654-46ef-8319-4576e7b264eb';
UPDATE public.job_listings SET title = 'CDL-A Drivers: Top Tier Lease Purchase Program! $0 Down, No Credit Check! | Texas', updated_at = now() WHERE id IN ('cbcdb5bb-f995-428d-8b1a-e6c1f1c739e2', '36291896-87c4-4ab7-9f62-60e28ac933a7', 'f1c1d375-c81e-495a-a749-9cb5d1e3a3a0', 'efd4d781-4a7c-4f9a-907e-42f5d7de080f', '084fafbf-44f5-439d-8277-0d3196277477', 'b5b88cf9-3799-41d6-93ce-508e5b27fb0a');

-- Re-enable triggers
ALTER TABLE public.job_listings ENABLE TRIGGER trg_google_indexing_notify;
ALTER TABLE public.job_listings ENABLE TRIGGER trigger_google_indexing_on_job_change;