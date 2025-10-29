-- Update Tenstreet credentials to PROD mode
UPDATE tenstreet_credentials
SET 
  mode = 'PROD',
  updated_at = NOW()
WHERE id = 'd3387853-6881-4cc9-8e08-2c57d87aaf7a';