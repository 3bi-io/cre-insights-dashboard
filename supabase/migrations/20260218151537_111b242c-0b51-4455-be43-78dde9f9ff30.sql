
-- Create org_api_keys table for external API access
CREATE TABLE public.org_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  label TEXT DEFAULT 'Default',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.org_api_keys ENABLE ROW LEVEL SECURITY;

-- Only org admins and super admins can manage their keys
CREATE POLICY "Admins manage own org API keys" ON public.org_api_keys
  FOR ALL TO authenticated
  USING (
    organization_id = public.get_user_organization_id()
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_super_admin(auth.uid()))
  )
  WITH CHECK (
    organization_id = public.get_user_organization_id()
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_super_admin(auth.uid()))
  );

-- Super admins can manage all org keys
CREATE POLICY "Super admins manage all API keys" ON public.org_api_keys
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Index for fast API key lookups
CREATE INDEX idx_org_api_keys_api_key ON public.org_api_keys(api_key) WHERE is_active = true;
CREATE INDEX idx_org_api_keys_org_id ON public.org_api_keys(organization_id);

-- Updated_at trigger
CREATE TRIGGER update_org_api_keys_updated_at
  BEFORE UPDATE ON public.org_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
