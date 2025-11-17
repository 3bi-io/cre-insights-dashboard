-- Modify client_webhooks table to use source filters instead of client_id

-- Add source_filter column (array of application sources)
ALTER TABLE client_webhooks 
ADD COLUMN source_filter TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Make client_id nullable since we're transitioning away from it
ALTER TABLE client_webhooks 
ALTER COLUMN client_id DROP NOT NULL;

-- Create index for source_filter lookups
CREATE INDEX idx_client_webhooks_source_filter ON client_webhooks USING GIN(source_filter);

-- Add comment explaining the new approach
COMMENT ON COLUMN client_webhooks.source_filter IS 'Array of application sources this webhook should trigger for. E.g. ["Direct Application", "ElevenLabs", "Facebook Lead Gen"]';

-- Update existing webhooks to have an empty source_filter (they will need to be reconfigured)
UPDATE client_webhooks 
SET source_filter = ARRAY[]::TEXT[] 
WHERE source_filter IS NULL;