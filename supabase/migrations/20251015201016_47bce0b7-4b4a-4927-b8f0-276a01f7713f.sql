-- Phase 1: Create Tenstreet Credentials Table
CREATE TABLE IF NOT EXISTS public.tenstreet_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  client_id TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  job_store_client_id TEXT,
  job_store_password_encrypted TEXT,
  xml_feed_url TEXT,
  company_ids TEXT[],
  apply_base_url TEXT,
  referral_code TEXT DEFAULT 'KEL0H',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, account_name)
);

-- Enable RLS
ALTER TABLE public.tenstreet_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins can manage all Tenstreet credentials"
ON public.tenstreet_credentials
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Org admins can manage their org credentials"
ON public.tenstreet_credentials
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) AND 
  organization_id = get_user_organization_id()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND 
  organization_id = get_user_organization_id()
);

-- Phase 2: Add Tenstreet metadata to job_listings
ALTER TABLE public.job_listings
ADD COLUMN IF NOT EXISTS tenstreet_company_id TEXT,
ADD COLUMN IF NOT EXISTS tenstreet_job_id TEXT,
ADD COLUMN IF NOT EXISTS tenstreet_source TEXT,
ADD COLUMN IF NOT EXISTS tenstreet_apply_url TEXT,
ADD COLUMN IF NOT EXISTS last_tenstreet_sync TIMESTAMPTZ;

-- Phase 3: Add Tenstreet tracking to applications
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS tenstreet_applied_via TEXT,
ADD COLUMN IF NOT EXISTS tenstreet_last_sync TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tenstreet_sync_status TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_job_listings_tenstreet_job_id ON public.job_listings(tenstreet_job_id);
CREATE INDEX IF NOT EXISTS idx_applications_driver_id ON public.applications(driver_id);

-- Trigger for updated_at on tenstreet_credentials
CREATE OR REPLACE FUNCTION public.handle_tenstreet_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenstreet_credentials_updated_at
BEFORE UPDATE ON public.tenstreet_credentials
FOR EACH ROW
EXECUTE FUNCTION public.handle_tenstreet_credentials_updated_at();