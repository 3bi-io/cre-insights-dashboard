-- Create tenstreet_credentials table to store organization-specific Tenstreet API credentials
CREATE TABLE IF NOT EXISTS public.tenstreet_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  client_id TEXT NOT NULL,
  password TEXT NOT NULL,
  company_id TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'test',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.tenstreet_credentials ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all credentials
CREATE POLICY "Super admins can manage all tenstreet credentials"
  ON public.tenstreet_credentials
  FOR ALL
  USING (is_super_admin(auth.uid()));

-- Organization admins can view and manage their org's credentials
CREATE POLICY "Org admins can manage their org tenstreet credentials"
  ON public.tenstreet_credentials
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    AND organization_id = get_user_organization_id()
  );

-- Create updated_at trigger
CREATE TRIGGER handle_tenstreet_credentials_updated_at
  BEFORE UPDATE ON public.tenstreet_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_tenstreet_credentials_updated_at();

-- Create the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_tenstreet_credentials_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add index for faster organization lookups
CREATE INDEX idx_tenstreet_credentials_organization_id 
  ON public.tenstreet_credentials(organization_id);