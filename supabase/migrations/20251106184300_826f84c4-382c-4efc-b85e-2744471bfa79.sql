-- Phase 1: Database Schema & RLS Cleanup

-- 1.1 Remove duplicate RLS policies
DROP POLICY IF EXISTS "Org admins can manage their org tenstreet credentials" ON tenstreet_credentials;
DROP POLICY IF EXISTS "Super admins can manage all tenstreet credentials" ON tenstreet_credentials;

-- 1.2 Consolidate password fields (remove password_encrypted)
ALTER TABLE tenstreet_credentials DROP COLUMN IF EXISTS password_encrypted;
COMMENT ON COLUMN tenstreet_credentials.password IS 'Tenstreet API password (stored encrypted at rest by Supabase)';

-- 1.3 Add performance indexes
CREATE INDEX IF NOT EXISTS idx_tenstreet_creds_org_status ON tenstreet_credentials(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tenstreet_creds_account ON tenstreet_credentials(account_name);

-- 1.4 Ensure updated_at trigger exists
DROP TRIGGER IF EXISTS tenstreet_credentials_updated_at ON tenstreet_credentials;
CREATE TRIGGER tenstreet_credentials_updated_at
  BEFORE UPDATE ON tenstreet_credentials
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Phase 2: Create optimized database function for service layer
CREATE OR REPLACE FUNCTION get_organizations_credentials_summary()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  created_at timestamptz,
  credential_id uuid,
  credential_status text,
  mode text,
  api_endpoint text,
  credentials_updated timestamptz,
  total_applications bigint,
  last_sync_time timestamptz,
  synced_count bigint,
  connection_health text
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.created_at,
    tc.id as credential_id,
    tc.status as credential_status,
    tc.mode,
    tc.api_endpoint,
    tc.updated_at as credentials_updated,
    COUNT(DISTINCT a.id) as total_applications,
    MAX(a.tenstreet_last_sync) as last_sync_time,
    COUNT(DISTINCT CASE WHEN a.tenstreet_sync_status = 'synced' THEN a.id END) as synced_count,
    CASE
      WHEN tc.id IS NULL THEN 'unknown'
      WHEN tc.status = 'inactive' THEN 'error'
      WHEN MAX(a.tenstreet_last_sync) IS NULL THEN 'inactive'
      WHEN MAX(a.tenstreet_last_sync) > NOW() - INTERVAL '7 days' THEN 'active'
      ELSE 'inactive'
    END as connection_health
  FROM organizations o
  LEFT JOIN tenstreet_credentials tc ON o.id = tc.organization_id
  LEFT JOIN job_listings jl ON o.id = jl.organization_id
  LEFT JOIN applications a ON jl.id = a.job_listing_id
  GROUP BY o.id, o.name, o.slug, o.created_at, tc.id, tc.status, tc.mode, tc.api_endpoint, tc.updated_at
  ORDER BY o.name;
$$;