-- Drop the existing CHECK constraint that excludes LinkedIn
ALTER TABLE social_beacon_configurations 
DROP CONSTRAINT IF EXISTS social_beacon_configurations_platform_check;

-- Add updated CHECK constraint that includes LinkedIn
ALTER TABLE social_beacon_configurations 
ADD CONSTRAINT social_beacon_configurations_platform_check 
CHECK (platform = ANY (ARRAY['x'::text, 'facebook'::text, 'instagram'::text, 'whatsapp'::text, 'tiktok'::text, 'reddit'::text, 'linkedin'::text]));