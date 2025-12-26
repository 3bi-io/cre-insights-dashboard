-- Create DriverReach credentials table (similar to Tenstreet)
CREATE TABLE public.driverreach_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  company_id TEXT NOT NULL,
  api_endpoint TEXT NOT NULL DEFAULT 'https://api.driverreach.com/v1',
  mode TEXT NOT NULL DEFAULT 'PROD' CHECK (mode IN ('DEV', 'TEST', 'PROD')),
  source TEXT DEFAULT '3BI',
  company_name TEXT,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- Create DriverReach field mappings table
CREATE TABLE public.driverreach_field_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  field_mappings JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add DriverReach sync columns to applications table
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS driverreach_sync_status TEXT,
ADD COLUMN IF NOT EXISTS driverreach_last_sync TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS driverreach_applied_via TEXT;

-- Enable RLS
ALTER TABLE public.driverreach_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driverreach_field_mappings ENABLE ROW LEVEL SECURITY;

-- RLS policies for driverreach_credentials
CREATE POLICY "Org admins can manage their credentials"
ON public.driverreach_credentials
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
);

CREATE POLICY "Super admins can manage all credentials"
ON public.driverreach_credentials
FOR ALL
USING (is_super_admin(auth.uid()));

-- RLS policies for driverreach_field_mappings
CREATE POLICY "Org admins can manage their mappings"
ON public.driverreach_field_mappings
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
);

CREATE POLICY "Super admins can manage all mappings"
ON public.driverreach_field_mappings
FOR ALL
USING (is_super_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_driverreach_credentials_updated_at
BEFORE UPDATE ON public.driverreach_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driverreach_field_mappings_updated_at
BEFORE UPDATE ON public.driverreach_field_mappings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_driverreach_credentials_org_status 
ON public.driverreach_credentials(organization_id, status);

CREATE INDEX idx_driverreach_field_mappings_org_default 
ON public.driverreach_field_mappings(organization_id, is_default);

-- Add index for application sync status queries
CREATE INDEX IF NOT EXISTS idx_applications_driverreach_sync 
ON public.applications(driverreach_sync_status) 
WHERE driverreach_sync_status IS NOT NULL;

COMMENT ON TABLE public.driverreach_credentials IS 'Stores DriverReach API credentials for each organization';
COMMENT ON TABLE public.driverreach_field_mappings IS 'Stores field mapping configurations for DriverReach integration';