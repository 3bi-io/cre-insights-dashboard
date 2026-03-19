
-- Table for per-client application field configuration
CREATE TABLE public.client_application_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, field_key)
);

-- Updated_at trigger
CREATE TRIGGER update_client_application_fields_updated_at
  BEFORE UPDATE ON public.client_application_fields
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.client_application_fields ENABLE ROW LEVEL SECURITY;

-- Admin/super_admin in same org can do everything
CREATE POLICY "Admins can manage client application fields"
  ON public.client_application_fields
  FOR ALL
  TO authenticated
  USING (
    organization_id = public.get_user_organization_id()
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_super_admin(auth.uid()))
  )
  WITH CHECK (
    organization_id = public.get_user_organization_id()
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_super_admin(auth.uid()))
  );

-- Security definer function for public (anonymous) read access
CREATE OR REPLACE FUNCTION public.get_client_application_fields(p_client_id uuid)
RETURNS TABLE(field_key text, enabled boolean, required boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT caf.field_key, caf.enabled, caf.required
  FROM public.client_application_fields caf
  WHERE caf.client_id = p_client_id;
$$;
