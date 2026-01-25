-- Hide all "General Application" listings across all Hayes Recruiting clients
-- This catches Danny Herman, Novco, Day and Ross, and any future auto-created listings
UPDATE job_listings 
SET is_hidden = true, updated_at = NOW()
WHERE title = 'General Application'
  AND is_hidden = false
  AND organization_id = '84214b48-7b51-45bc-ad7f-723bcf50466c';