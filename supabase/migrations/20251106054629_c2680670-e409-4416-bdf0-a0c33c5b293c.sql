-- Allow public access to view active job listings
CREATE POLICY "Public can view active job listings" ON job_listings
  FOR SELECT
  USING (status = 'active');
