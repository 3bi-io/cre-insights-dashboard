-- Hide visible "General Application" listings for Pemberton that are polluting the job board
UPDATE job_listings 
SET is_hidden = true, updated_at = NOW()
WHERE client_id = '67cadf11-8cce-41c6-8e19-7d2bb0be3b03'
  AND title = 'General Application'
  AND is_hidden = false;