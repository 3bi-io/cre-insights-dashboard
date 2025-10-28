-- Phase 1: Data Cleanup and Foreign Key Relationship

-- Step 1: Create default "Unassigned" clients for each organization that doesn't have one
INSERT INTO clients (name, status, organization_id, notes)
SELECT 
  'Unassigned',
  'active',
  o.id,
  'Default client for jobs without a specific client'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM clients c 
  WHERE c.organization_id = o.id 
  AND c.name = 'Unassigned'
);

-- Step 2: Migrate jobs with text 'client' field but NULL client_id
-- Try to match existing clients by name within the same organization
UPDATE job_listings jl
SET client_id = c.id
FROM clients c
WHERE jl.client_id IS NULL
  AND jl.client IS NOT NULL
  AND jl.client != ''
  AND c.organization_id = jl.organization_id
  AND LOWER(TRIM(c.name)) = LOWER(TRIM(jl.client));

-- Step 3: Create new clients for jobs with text 'client' but no matching client record
INSERT INTO clients (name, status, organization_id, notes)
SELECT DISTINCT 
  TRIM(jl.client),
  'active',
  jl.organization_id,
  'Auto-created from job listing'
FROM job_listings jl
WHERE jl.client_id IS NULL
  AND jl.client IS NOT NULL
  AND jl.client != ''
  AND NOT EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.organization_id = jl.organization_id 
    AND LOWER(TRIM(c.name)) = LOWER(TRIM(jl.client))
  );

-- Step 4: Update jobs to use newly created clients
UPDATE job_listings jl
SET client_id = c.id
FROM clients c
WHERE jl.client_id IS NULL
  AND jl.client IS NOT NULL
  AND jl.client != ''
  AND c.organization_id = jl.organization_id
  AND LOWER(TRIM(c.name)) = LOWER(TRIM(jl.client));

-- Step 5: Set remaining NULL client_id jobs to use "Unassigned" client
UPDATE job_listings jl
SET client_id = c.id
FROM clients c
WHERE jl.client_id IS NULL
  AND c.organization_id = jl.organization_id
  AND c.name = 'Unassigned';

-- Step 6: Add foreign key constraint (with ON DELETE SET NULL to prevent orphaning)
ALTER TABLE job_listings
ADD CONSTRAINT fk_job_listings_client_id
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE SET NULL;

-- Step 7: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_job_listings_client_id ON job_listings(client_id);

-- Step 8: Create function to auto-create client if needed
CREATE OR REPLACE FUNCTION auto_create_client_for_job()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_client_id uuid;
  new_client_id uuid;
BEGIN
  -- If client_id is already set, no action needed
  IF NEW.client_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- If there's a client text field, try to find or create matching client
  IF NEW.client IS NOT NULL AND TRIM(NEW.client) != '' THEN
    -- Try to find existing client with same name in the organization
    SELECT id INTO new_client_id
    FROM clients
    WHERE organization_id = NEW.organization_id
      AND LOWER(TRIM(name)) = LOWER(TRIM(NEW.client))
    LIMIT 1;

    -- If found, use it
    IF new_client_id IS NOT NULL THEN
      NEW.client_id := new_client_id;
      RETURN NEW;
    END IF;

    -- Otherwise create new client
    INSERT INTO clients (name, status, organization_id, notes)
    VALUES (TRIM(NEW.client), 'active', NEW.organization_id, 'Auto-created from job listing')
    RETURNING id INTO new_client_id;

    NEW.client_id := new_client_id;
    RETURN NEW;
  END IF;

  -- If no client text, use "Unassigned" default client
  SELECT id INTO default_client_id
  FROM clients
  WHERE organization_id = NEW.organization_id
    AND name = 'Unassigned'
  LIMIT 1;

  -- If Unassigned doesn't exist, create it
  IF default_client_id IS NULL THEN
    INSERT INTO clients (name, status, organization_id, notes)
    VALUES ('Unassigned', 'active', NEW.organization_id, 'Default client for jobs without a specific client')
    RETURNING id INTO default_client_id;
  END IF;

  NEW.client_id := default_client_id;
  RETURN NEW;
END;
$$;

-- Step 9: Create trigger to auto-assign client_id on insert or update
DROP TRIGGER IF EXISTS trigger_auto_create_client ON job_listings;
CREATE TRIGGER trigger_auto_create_client
  BEFORE INSERT OR UPDATE ON job_listings
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_client_for_job();