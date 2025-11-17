-- Create organization_webhooks table for n8n webhook configuration
CREATE TABLE IF NOT EXISTS public.organization_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  secret_key TEXT,
  last_triggered_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_organization_webhooks_org_id ON public.organization_webhooks(organization_id);

-- Enable RLS
ALTER TABLE public.organization_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins have full access to organization webhooks"
  ON public.organization_webhooks
  FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Org admins can view their organization webhooks"
  ON public.organization_webhooks
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) AND 
    organization_id = get_user_organization_id()
  );

CREATE POLICY "Org admins can insert their organization webhooks"
  ON public.organization_webhooks
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) AND 
    organization_id = get_user_organization_id()
  );

CREATE POLICY "Org admins can update their organization webhooks"
  ON public.organization_webhooks
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) AND 
    organization_id = get_user_organization_id()
  );

CREATE POLICY "Org admins can delete their organization webhooks"
  ON public.organization_webhooks
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role) AND 
    organization_id = get_user_organization_id()
  );

-- Trigger for updated_at
CREATE TRIGGER update_organization_webhooks_updated_at
  BEFORE UPDATE ON public.organization_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();