-- Add password column to tenstreet_credentials for API access
-- Note: password_encrypted exists for storage, but we need plaintext for XML API calls
ALTER TABLE tenstreet_credentials 
ADD COLUMN IF NOT EXISTS password text;

-- Add comment explaining the dual password fields
COMMENT ON COLUMN tenstreet_credentials.password IS 'Plaintext password for Tenstreet API XML requests (required by their API)';
COMMENT ON COLUMN tenstreet_credentials.password_encrypted IS 'Encrypted password for secure storage (backup/reference only)';

-- Update existing records to copy encrypted to plaintext (temporary - users should update)
UPDATE tenstreet_credentials 
SET password = password_encrypted 
WHERE password IS NULL AND password_encrypted IS NOT NULL;