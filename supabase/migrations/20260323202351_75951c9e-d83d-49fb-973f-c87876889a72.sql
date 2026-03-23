UPDATE job_listings 
SET apply_url = url, updated_at = now()
WHERE client_id = '82513316-7df2-4bf0-83d8-6c511c83ddfb' 
  AND status = 'active'
  AND url IS NOT NULL;