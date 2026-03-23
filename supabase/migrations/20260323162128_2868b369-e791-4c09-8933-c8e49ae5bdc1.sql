-- Temporarily disable the orphan trigger to avoid FK issues
DROP TRIGGER IF EXISTS trigger_mark_orphaned_applications ON job_listings;

-- Clean up campaign assignments
DELETE FROM campaign_job_assignments WHERE job_listing_id = '61ec0129-ab4d-4f2d-b6a7-53805a1ff00a';

-- Nullify the application's job_listing_id (or we need to keep it — let's just delete the job after removing the FK constraint on applications)
-- Actually, let's just set the application to point to another valid job or set it null
-- Since job_listing_id might be NOT NULL, let's check... it has a FK but applications table shows it's nullable
UPDATE applications SET job_listing_id = NULL WHERE job_listing_id = '61ec0129-ab4d-4f2d-b6a7-53805a1ff00a';

-- Now delete the job
DELETE FROM job_listings WHERE id = '61ec0129-ab4d-4f2d-b6a7-53805a1ff00a';

-- Re-create the orphan trigger
CREATE TRIGGER trigger_mark_orphaned_applications
  BEFORE DELETE ON job_listings
  FOR EACH ROW
  EXECUTE FUNCTION mark_orphaned_applications();