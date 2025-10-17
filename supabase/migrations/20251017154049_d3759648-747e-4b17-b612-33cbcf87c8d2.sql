-- Drop existing CASCADE foreign key and add SET NULL behavior
ALTER TABLE applications
DROP CONSTRAINT IF EXISTS applications_job_listing_id_fkey;

ALTER TABLE applications
ADD CONSTRAINT applications_job_listing_id_fkey
FOREIGN KEY (job_listing_id)
REFERENCES job_listings(id)
ON DELETE SET NULL;

-- Create function to mark orphaned applications with special UUID
CREATE OR REPLACE FUNCTION mark_orphaned_applications()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all applications linked to the deleted job with orphaned marker
  UPDATE applications
  SET job_listing_id = '00000000-0000-0000-0000-000000000000'::uuid
  WHERE job_listing_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger that runs before job deletion
CREATE TRIGGER before_job_listing_delete
BEFORE DELETE ON job_listings
FOR EACH ROW
EXECUTE FUNCTION mark_orphaned_applications();

-- Backfill existing applications with non-existent job_listing_ids
UPDATE applications
SET job_listing_id = '00000000-0000-0000-0000-000000000000'::uuid
WHERE job_listing_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM job_listings WHERE id = applications.job_listing_id
  );