-- ============================================
-- ATS Systems Registry
-- Defines all supported ATS systems and their schemas
-- ============================================
CREATE TABLE public.ats_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  api_type TEXT NOT NULL CHECK (api_type IN ('xml_post', 'rest_json', 'graphql', 'webhook', 'soap')),
  base_endpoint TEXT,
  credential_schema JSONB NOT NULL DEFAULT '{}',
  field_schema JSONB DEFAULT '{}',
  supports_test_mode BOOLEAN DEFAULT true,
  documentation_url TEXT,
  logo_url TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('trucking', 'healthcare', 'tech', 'general', 'hospitality', 'retail')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ats_systems ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ats_systems (read-only for most users)
CREATE POLICY "Anyone can view active ATS systems"
  ON public.ats_systems FOR SELECT
  USING (is_active = true OR is_super_admin(auth.uid()));

CREATE POLICY "Only super admins can manage ATS systems"
  ON public.ats_systems FOR ALL
  USING (is_super_admin(auth.uid()));

-- Seed with known ATS systems
INSERT INTO public.ats_systems (name, slug, api_type, credential_schema, field_schema, category, documentation_url) VALUES
  ('Tenstreet', 'tenstreet', 'xml_post', 
   '{"client_id": {"type": "string", "required": true, "label": "Client ID"}, "password": {"type": "password", "required": true, "label": "Password"}, "company_ids": {"type": "array", "required": false, "label": "Company IDs"}, "mode": {"type": "select", "options": ["DEV", "TEST", "PROD"], "required": true, "label": "Mode"}}',
   '{"supports": ["driver_upload", "status_update", "mvr", "background_check", "drug_test"]}',
   'trucking', 'https://tenstreet.com/api-docs'),
  ('DriverReach', 'driverreach', 'rest_json',
   '{"api_key": {"type": "password", "required": true, "label": "API Key"}, "company_id": {"type": "string", "required": true, "label": "Company ID"}}',
   '{"supports": ["application_submit", "status_sync"]}',
   'trucking', 'https://driverreach.com/api'),
  ('Greenhouse', 'greenhouse', 'rest_json',
   '{"api_key": {"type": "password", "required": true, "label": "API Key"}, "on_behalf_of": {"type": "string", "required": false, "label": "On Behalf Of User ID"}}',
   '{"supports": ["application_submit", "candidate_create", "job_sync"]}',
   'general', 'https://developers.greenhouse.io'),
  ('Lever', 'lever', 'rest_json',
   '{"api_key": {"type": "password", "required": true, "label": "API Key"}}',
   '{"supports": ["application_submit", "candidate_create"]}',
   'tech', 'https://hire.lever.co/developer'),
  ('Workable', 'workable', 'rest_json',
   '{"api_key": {"type": "password", "required": true, "label": "API Token"}, "subdomain": {"type": "string", "required": true, "label": "Subdomain"}}',
   '{"supports": ["application_submit", "job_sync"]}',
   'general', 'https://workable.readme.io'),
  ('JazzHR', 'jazzhr', 'rest_json',
   '{"api_key": {"type": "password", "required": true, "label": "API Key"}}',
   '{"supports": ["application_submit"]}',
   'general', 'https://www.jazzhr.com/api'),
  ('BambooHR', 'bamboohr', 'rest_json',
   '{"api_key": {"type": "password", "required": true, "label": "API Key"}, "subdomain": {"type": "string", "required": true, "label": "Company Subdomain"}}',
   '{"supports": ["application_submit", "employee_sync"]}',
   'general', 'https://documentation.bamboohr.com'),
  ('iCIMS', 'icims', 'rest_json',
   '{"customer_id": {"type": "string", "required": true, "label": "Customer ID"}, "api_key": {"type": "password", "required": true, "label": "API Key"}}',
   '{"supports": ["application_submit", "job_sync"]}',
   'general', 'https://developer.icims.com');

-- ============================================
-- ATS Connections
-- Links organizations/clients to ATS systems with credentials
-- ============================================
CREATE TABLE public.ats_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  ats_system_id UUID NOT NULL REFERENCES public.ats_systems(id),
  name TEXT NOT NULL,
  credentials JSONB NOT NULL DEFAULT '{}',
  mode TEXT NOT NULL DEFAULT 'test' CHECK (mode IN ('test', 'production')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error', 'disabled')),
  is_auto_post_enabled BOOLEAN DEFAULT false,
  auto_post_on_status TEXT[] DEFAULT ARRAY['pending'],
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  sync_stats JSONB DEFAULT '{"total_sent": 0, "total_success": 0, "total_failed": 0}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, client_id, ats_system_id, mode)
);

-- Enable RLS
ALTER TABLE public.ats_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ats_connections
CREATE POLICY "Users can view their org ATS connections"
  ON public.ats_connections FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Admins can create ATS connections for their org"
  ON public.ats_connections FOR INSERT
  WITH CHECK (
    (has_role(auth.uid(), 'admin'::app_role) AND organization_id = get_user_organization_id())
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Admins can update their org ATS connections"
  ON public.ats_connections FOR UPDATE
  USING (
    (has_role(auth.uid(), 'admin'::app_role) AND organization_id = get_user_organization_id())
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Admins can delete their org ATS connections"
  ON public.ats_connections FOR DELETE
  USING (
    (has_role(auth.uid(), 'admin'::app_role) AND organization_id = get_user_organization_id())
    OR is_super_admin(auth.uid())
  );

-- ============================================
-- ATS Field Mappings
-- Maps application fields to ATS-specific fields
-- ============================================
CREATE TABLE public.ats_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ats_connection_id UUID NOT NULL REFERENCES public.ats_connections(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default Mapping',
  field_mappings JSONB NOT NULL DEFAULT '{}',
  transform_rules JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ats_field_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ats_field_mappings
CREATE POLICY "Users can view field mappings for their org connections"
  ON public.ats_field_mappings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ats_connections ac
      WHERE ac.id = ats_field_mappings.ats_connection_id
      AND (ac.organization_id = get_user_organization_id() OR is_super_admin(auth.uid()))
    )
  );

CREATE POLICY "Admins can manage field mappings for their org"
  ON public.ats_field_mappings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.ats_connections ac
      WHERE ac.id = ats_field_mappings.ats_connection_id
      AND (
        (has_role(auth.uid(), 'admin'::app_role) AND ac.organization_id = get_user_organization_id())
        OR is_super_admin(auth.uid())
      )
    )
  );

-- ============================================
-- ATS Sync Logs
-- Tracks all ATS integration activity
-- ============================================
CREATE TABLE public.ats_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ats_connection_id UUID NOT NULL REFERENCES public.ats_connections(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  request_payload JSONB,
  response_data JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ats_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ats_sync_logs
CREATE POLICY "Users can view sync logs for their org connections"
  ON public.ats_sync_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ats_connections ac
      WHERE ac.id = ats_sync_logs.ats_connection_id
      AND (ac.organization_id = get_user_organization_id() OR is_super_admin(auth.uid()))
    )
  );

CREATE POLICY "System can insert sync logs"
  ON public.ats_sync_logs FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_ats_connections_org ON public.ats_connections(organization_id);
CREATE INDEX idx_ats_connections_client ON public.ats_connections(client_id);
CREATE INDEX idx_ats_connections_status ON public.ats_connections(status);
CREATE INDEX idx_ats_field_mappings_connection ON public.ats_field_mappings(ats_connection_id);
CREATE INDEX idx_ats_sync_logs_connection ON public.ats_sync_logs(ats_connection_id);
CREATE INDEX idx_ats_sync_logs_application ON public.ats_sync_logs(application_id);
CREATE INDEX idx_ats_sync_logs_created ON public.ats_sync_logs(created_at DESC);

-- Create updated_at triggers
CREATE TRIGGER update_ats_systems_updated_at
  BEFORE UPDATE ON public.ats_systems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ats_connections_updated_at
  BEFORE UPDATE ON public.ats_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ats_field_mappings_updated_at
  BEFORE UPDATE ON public.ats_field_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();