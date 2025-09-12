-- Create organization platform access table
CREATE TABLE public.organization_platform_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform_name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, platform_name)
);

-- Enable RLS
ALTER TABLE public.organization_platform_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins can manage all platform access"
ON public.organization_platform_access
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Organization admins can view their platform access"
ON public.organization_platform_access
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
);

CREATE POLICY "Organization members can view their platform access"
ON public.organization_platform_access
FOR SELECT
USING (organization_id = get_user_organization_id());

-- Create trigger for updated_at
CREATE TRIGGER update_organization_platform_access_updated_at
  BEFORE UPDATE ON public.organization_platform_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if organization has access to platform
CREATE OR REPLACE FUNCTION public.organization_has_platform_access(_org_id UUID, _platform_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT enabled FROM public.organization_platform_access 
     WHERE organization_id = _org_id AND platform_name = _platform_name),
    true  -- Default to enabled if no record exists
  )
$$;

-- Function to get current user's organization platform access
CREATE OR REPLACE FUNCTION public.get_user_platform_access(_platform_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.organization_has_platform_access(
    public.get_user_organization_id(),
    _platform_name
  )
$$;

-- Function for super admins to manage platform access
CREATE OR REPLACE FUNCTION public.set_organization_platform_access(
  _org_id UUID,
  _platform_name TEXT,
  _enabled BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only super admins can manage platform access
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can manage platform access';
  END IF;

  -- Upsert platform access record
  INSERT INTO public.organization_platform_access (organization_id, platform_name, enabled)
  VALUES (_org_id, _platform_name, _enabled)
  ON CONFLICT (organization_id, platform_name)
  DO UPDATE SET 
    enabled = _enabled,
    updated_at = now();
END;
$$;

-- Function to get all platform access for an organization
CREATE OR REPLACE FUNCTION public.get_organization_platform_access(_org_id UUID)
RETURNS TABLE(
  platform_name TEXT,
  enabled BOOLEAN,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    platform_name,
    enabled,
    updated_at
  FROM public.organization_platform_access
  WHERE organization_id = _org_id
  ORDER BY platform_name
$$;