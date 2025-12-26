-- Create background check providers table (system-wide reference)
CREATE TABLE public.background_check_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  api_type TEXT NOT NULL DEFAULT 'rest_json',
  base_url TEXT NOT NULL,
  auth_type TEXT NOT NULL DEFAULT 'api_key',
  supported_checks JSONB NOT NULL DEFAULT '[]'::jsonb,
  webhook_config JSONB DEFAULT '{}'::jsonb,
  pricing JSONB DEFAULT '{}'::jsonb,
  documentation_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create organization background check connections
CREATE TABLE public.organization_bgc_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.background_check_providers(id) ON DELETE CASCADE,
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_enabled BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  package_mappings JSONB DEFAULT '{}'::jsonb,
  webhook_secret TEXT,
  mode TEXT NOT NULL DEFAULT 'test',
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, provider_id)
);

-- Create background check requests table for tracking
CREATE TABLE public.background_check_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  provider_id UUID NOT NULL REFERENCES public.background_check_providers(id),
  connection_id UUID REFERENCES public.organization_bgc_connections(id),
  external_id TEXT,
  candidate_id TEXT,
  check_type TEXT NOT NULL,
  package_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  result TEXT,
  result_data JSONB DEFAULT '{}'::jsonb,
  report_url TEXT,
  candidate_portal_url TEXT,
  cost_cents INTEGER,
  initiated_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.background_check_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_bgc_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.background_check_requests ENABLE ROW LEVEL SECURITY;

-- RLS for background_check_providers (system table - read only for authenticated)
CREATE POLICY "Anyone can view active providers"
  ON public.background_check_providers FOR SELECT
  USING (is_active = true OR is_super_admin(auth.uid()));

CREATE POLICY "Only super admins can manage providers"
  ON public.background_check_providers FOR ALL
  USING (is_super_admin(auth.uid()));

-- RLS for organization_bgc_connections
CREATE POLICY "Users can view their org BGC connections"
  ON public.organization_bgc_connections FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage their org BGC connections"
  ON public.organization_bgc_connections FOR ALL
  USING ((has_role(auth.uid(), 'admin'::app_role) AND organization_id = get_user_organization_id()) OR is_super_admin(auth.uid()));

-- RLS for background_check_requests
CREATE POLICY "Users can view their org BGC requests"
  ON public.background_check_requests FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Users can create BGC requests for their org"
  ON public.background_check_requests FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Admins can update BGC requests in their org"
  ON public.organization_bgc_connections FOR UPDATE
  USING ((has_role(auth.uid(), 'admin'::app_role) AND organization_id = get_user_organization_id()) OR is_super_admin(auth.uid()));

-- System can update requests via webhooks
CREATE POLICY "System can update BGC requests"
  ON public.background_check_requests FOR UPDATE
  USING (true);

-- Create indexes
CREATE INDEX idx_bgc_providers_slug ON public.background_check_providers(slug);
CREATE INDEX idx_bgc_connections_org ON public.organization_bgc_connections(organization_id);
CREATE INDEX idx_bgc_requests_org ON public.background_check_requests(organization_id);
CREATE INDEX idx_bgc_requests_application ON public.background_check_requests(application_id);
CREATE INDEX idx_bgc_requests_external ON public.background_check_requests(external_id);
CREATE INDEX idx_bgc_requests_status ON public.background_check_requests(status);

-- Seed the 5 background check providers
INSERT INTO public.background_check_providers (slug, name, api_type, base_url, auth_type, supported_checks, webhook_config, pricing, documentation_url, logo_url) VALUES
('checkr', 'Checkr', 'rest_json', 'https://api.checkr.com/v1', 'basic_auth', 
  '["criminal", "ssn_trace", "sex_offender", "global_watchlist", "national_criminal", "county_criminal", "federal_criminal", "mvr", "employment", "education", "drug"]'::jsonb,
  '{"events": ["report.completed", "report.created", "candidate.created", "invitation.completed"], "signature_header": "X-Checkr-Signature"}'::jsonb,
  '{"basic_criminal": 3500, "mvr": 2500, "ssn_trace": 500, "employment": 2500, "education": 2500, "drug_5panel": 4500}'::jsonb,
  'https://docs.checkr.com', '/integrations/checkr-logo.svg'),

('sterling', 'Sterling', 'rest_json', 'https://api.sterlingcheck.com/v2', 'oauth2',
  '["criminal", "employment", "education", "mvr", "drug", "credit", "i9", "professional_license"]'::jsonb,
  '{"events": ["ORDER_STATUS_CHANGED", "RESULT_READY"], "signature_header": "X-Sterling-Signature"}'::jsonb,
  '{"standard_criminal": 4000, "mvr": 3000, "employment": 3000, "education": 3000}'::jsonb,
  'https://developer.sterlingcheck.com', '/integrations/sterling-logo.svg'),

('hireright', 'HireRight', 'rest_json', 'https://api.hireright.com/v1', 'api_key',
  '["criminal", "employment", "education", "mvr", "drug", "credit", "professional_license", "sanctions"]'::jsonb,
  '{"events": ["order.completed", "order.updated"], "signature_header": "X-HireRight-Signature"}'::jsonb,
  '{"basic_criminal": 4500, "mvr": 3500, "employment": 3500, "education": 3500}'::jsonb,
  'https://developer.hireright.com', '/integrations/hireright-logo.svg'),

('goodhire', 'GoodHire', 'rest_json', 'https://api.goodhire.com/v1', 'api_key',
  '["criminal", "ssn_trace", "sex_offender", "mvr", "employment", "education", "drug"]'::jsonb,
  '{"events": ["report.complete", "report.suspended"], "signature_header": "X-GoodHire-Signature"}'::jsonb,
  '{"basic": 2999, "standard": 5499, "premium": 7999, "mvr": 1999}'::jsonb,
  'https://developer.goodhire.com', '/integrations/goodhire-logo.svg'),

('accurate', 'Accurate Background', 'rest_json', 'https://api.accuratebackground.com/v3', 'oauth2',
  '["criminal", "employment", "education", "mvr", "drug", "credit", "civil_court", "professional_license"]'::jsonb,
  '{"events": ["order.complete", "order.updated", "order.alert"], "signature_header": "X-Accurate-Signature"}'::jsonb,
  '{"criminal_basic": 3500, "mvr": 2800, "employment": 2800, "drug_5panel": 4000}'::jsonb,
  'https://developer.accuratebackground.com', '/integrations/accurate-logo.svg');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_bgc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bgc_providers_updated_at
  BEFORE UPDATE ON public.background_check_providers
  FOR EACH ROW EXECUTE FUNCTION update_bgc_updated_at();

CREATE TRIGGER update_bgc_connections_updated_at
  BEFORE UPDATE ON public.organization_bgc_connections
  FOR EACH ROW EXECUTE FUNCTION update_bgc_updated_at();

CREATE TRIGGER update_bgc_requests_updated_at
  BEFORE UPDATE ON public.background_check_requests
  FOR EACH ROW EXECUTE FUNCTION update_bgc_updated_at();