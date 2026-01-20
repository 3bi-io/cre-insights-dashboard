-- Phase 1: Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view active clients with jobs" ON clients;

-- Phase 3: Clean up duplicate clients within organizations
-- First, update job_listings to point to the kept client (oldest entry)
WITH duplicates AS (
  SELECT 
    name,
    organization_id,
    MIN(created_at) as keep_created_at,
    array_agg(id ORDER BY created_at) as all_ids
  FROM clients
  WHERE organization_id IS NOT NULL
  GROUP BY name, organization_id
  HAVING COUNT(*) > 1
),
keep_records AS (
  SELECT 
    c.id as keep_id,
    d.name,
    d.organization_id,
    d.all_ids
  FROM duplicates d
  JOIN clients c ON c.name = d.name 
    AND c.organization_id = d.organization_id 
    AND c.created_at = d.keep_created_at
)
UPDATE job_listings jl
SET client_id = kr.keep_id
FROM keep_records kr
WHERE jl.client_id = ANY(kr.all_ids)
  AND jl.client_id != kr.keep_id;

-- Delete duplicate clients (keeping the oldest)
WITH duplicates AS (
  SELECT 
    name,
    organization_id,
    MIN(created_at) as keep_created_at,
    array_agg(id ORDER BY created_at) as all_ids
  FROM clients
  WHERE organization_id IS NOT NULL
  GROUP BY name, organization_id
  HAVING COUNT(*) > 1
),
keep_records AS (
  SELECT 
    c.id as keep_id,
    d.all_ids
  FROM duplicates d
  JOIN clients c ON c.name = d.name 
    AND c.organization_id = d.organization_id 
    AND c.created_at = d.keep_created_at
),
ids_to_delete AS (
  SELECT unnest(all_ids) as id, keep_id
  FROM keep_records
)
DELETE FROM clients 
WHERE id IN (
  SELECT id FROM ids_to_delete WHERE id != keep_id
);

-- Phase 4: Add unique constraint to prevent future duplicates within same org
ALTER TABLE clients 
ADD CONSTRAINT unique_client_name_per_org 
UNIQUE (name, organization_id);