-- Reset Danny Herman Trucking and Day & Ross ATS connections to active
UPDATE ats_connections
SET status = 'active',
    last_error = NULL,
    updated_at = now()
WHERE id IN (
  '6b164de1-15d0-4164-9f3e-f66f56c7cc19',  -- Danny Herman Trucking
  'db6b96a7-f9fb-4979-a3be-4017bb2bef3f'   -- Day & Ross
);