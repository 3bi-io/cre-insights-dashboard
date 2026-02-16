
-- Create organization_call_settings table
CREATE TABLE public.organization_call_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  auto_follow_up_enabled BOOLEAN NOT NULL DEFAULT true,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  follow_up_delay_hours INTEGER NOT NULL DEFAULT 4,
  business_hours_start TIME NOT NULL DEFAULT '09:00:00',
  business_hours_end TIME NOT NULL DEFAULT '16:30:00',
  business_hours_timezone TEXT NOT NULL DEFAULT 'America/Chicago',
  business_days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_org_call_settings UNIQUE (organization_id)
);

-- Enable RLS
ALTER TABLE public.organization_call_settings ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Super admins full access on organization_call_settings"
  ON public.organization_call_settings
  FOR ALL
  USING (public.is_super_admin(auth.uid()));

-- Org admins can view and update their own org settings
CREATE POLICY "Org admins can view their call settings"
  ON public.organization_call_settings
  FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org admins can update their call settings"
  ON public.organization_call_settings
  FOR UPDATE
  USING (
    organization_id = public.get_user_organization_id()
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Timestamp trigger
CREATE TRIGGER update_organization_call_settings_updated_at
  BEFORE UPDATE ON public.organization_call_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
