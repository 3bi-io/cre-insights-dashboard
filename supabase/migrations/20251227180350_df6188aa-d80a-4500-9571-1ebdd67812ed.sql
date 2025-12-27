-- Clean up duplicate super admin policies on organization_features
DROP POLICY IF EXISTS "Super admins can manage all org features" ON public.organization_features;
DROP POLICY IF EXISTS "Super admins can manage organization features" ON public.organization_features;

-- Add explicit super admin SELECT policy (super admins can read ALL org features, not just their own)
CREATE POLICY "Super admins can read all org features"
ON public.organization_features
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- Keep a single super admin ALL policy for insert/update/delete
CREATE POLICY "Super admins can manage all org features"
ON public.organization_features
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));