
-- Create user_client_assignments junction table
CREATE TABLE public.user_client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(user_id, client_id)
);

-- Enable RLS
ALTER TABLE public.user_client_assignments ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Super admins full access on user_client_assignments"
ON public.user_client_assignments
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Org admins can view assignments for users in their organization
CREATE POLICY "Org admins can view assignments for their org users"
ON public.user_client_assignments
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_client_assignments.user_id
    AND p.organization_id = public.get_user_organization_id()
  )
);

-- Org admins can manage assignments for users in their organization
CREATE POLICY "Org admins can manage assignments for their org users"
ON public.user_client_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_client_assignments.user_id
    AND p.organization_id = public.get_user_organization_id()
  )
);

-- Org admins can delete assignments for users in their organization
CREATE POLICY "Org admins can delete assignments for their org users"
ON public.user_client_assignments
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_client_assignments.user_id
    AND p.organization_id = public.get_user_organization_id()
  )
);

-- Users can view their own assignments
CREATE POLICY "Users can view their own client assignments"
ON public.user_client_assignments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Add indexes for performance
CREATE INDEX idx_user_client_assignments_user_id ON public.user_client_assignments(user_id);
CREATE INDEX idx_user_client_assignments_client_id ON public.user_client_assignments(client_id);
