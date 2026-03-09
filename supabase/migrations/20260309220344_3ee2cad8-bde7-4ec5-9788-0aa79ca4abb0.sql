-- Add INSERT policy for org admins on organization_call_settings
CREATE POLICY "Org admins can insert call settings"
ON public.organization_call_settings
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.get_user_organization_id()
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Drop and recreate UPDATE policy with proper WITH CHECK
DROP POLICY IF EXISTS "Org admins can update own settings" ON public.organization_call_settings;

CREATE POLICY "Org admins can update own settings"
ON public.organization_call_settings
FOR UPDATE
TO authenticated
USING (
  organization_id = public.get_user_organization_id()
  AND public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  organization_id = public.get_user_organization_id()
  AND public.has_role(auth.uid(), 'admin'::app_role)
);