-- Add missing columns to tenstreet_credentials for comprehensive configuration
ALTER TABLE public.tenstreet_credentials
ADD COLUMN IF NOT EXISTS service TEXT DEFAULT 'subject_upload',
ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'PROD',
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS app_referrer TEXT DEFAULT '3BI';

-- Rename password_encrypted to password for simplicity (passwords should be stored encrypted in production)
-- But for now we'll work with the existing schema
COMMENT ON COLUMN public.tenstreet_credentials.password_encrypted IS 'Encrypted Tenstreet API password';