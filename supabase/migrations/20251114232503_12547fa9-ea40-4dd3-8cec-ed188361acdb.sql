-- Enable Row Level Security on tenstreet_credentials table
ALTER TABLE tenstreet_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can manage all credentials (full access)
CREATE POLICY "super_admins_full_access"
ON tenstreet_credentials
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Policy: Organization admins can view their org's credentials
CREATE POLICY "org_admins_view_credentials"
ON tenstreet_credentials
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND organization_id = get_user_organization_id()
);

-- Policy: Organization admins can insert credentials for their org
CREATE POLICY "org_admins_insert_credentials"
ON tenstreet_credentials
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND organization_id = get_user_organization_id()
);

-- Policy: Organization admins can update their org's credentials
CREATE POLICY "org_admins_update_credentials"
ON tenstreet_credentials
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND organization_id = get_user_organization_id()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND organization_id = get_user_organization_id()
);

-- Policy: Organization admins can delete their org's credentials
CREATE POLICY "org_admins_delete_credentials"
ON tenstreet_credentials
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND organization_id = get_user_organization_id()
);

-- Add index on organization_id for better query performance
CREATE INDEX IF NOT EXISTS idx_tenstreet_credentials_organization_id 
ON tenstreet_credentials(organization_id);

-- Add comment documenting the security model
COMMENT ON TABLE tenstreet_credentials IS 
'Stores Tenstreet API credentials. RLS enforced: Super admins have full access, organization admins can only access their own org credentials. Passwords are encrypted at rest by Supabase.';
