-- Add UTM tracking columns to applications table
ALTER TABLE applications 
  ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100),
  ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100),
  ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100);

-- Create index for analytics queries on UTM parameters
CREATE INDEX IF NOT EXISTS idx_applications_utm_source ON applications(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_applications_utm_medium ON applications(utm_medium) WHERE utm_medium IS NOT NULL;