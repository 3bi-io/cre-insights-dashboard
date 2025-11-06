-- Add API endpoint column to tenstreet_credentials table
ALTER TABLE tenstreet_credentials 
ADD COLUMN api_endpoint text DEFAULT '/api/auth/login';

COMMENT ON COLUMN tenstreet_credentials.api_endpoint IS 
'Tenstreet API endpoint for integration (e.g., /api/auth/login, /api/dashboard/overview, etc.)';