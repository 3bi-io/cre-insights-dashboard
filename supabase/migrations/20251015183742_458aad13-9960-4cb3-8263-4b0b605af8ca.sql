-- Enable RLS on meta_daily_spend
ALTER TABLE public.meta_daily_spend ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can view all spend data
CREATE POLICY "super_admins_view_all_meta_spend"
ON public.meta_daily_spend
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- Policy: Organization admins can view their org's spend data
CREATE POLICY "org_admins_view_org_meta_spend"
ON public.meta_daily_spend
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
);

-- Policy: Super admins can insert spend data
CREATE POLICY "super_admins_insert_meta_spend"
ON public.meta_daily_spend
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin(auth.uid()));

-- Policy: Super admins can update spend data
CREATE POLICY "super_admins_update_meta_spend"
ON public.meta_daily_spend
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()));

-- Enable RLS on meta_campaigns
ALTER TABLE public.meta_campaigns ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can view all campaigns
CREATE POLICY "super_admins_view_all_meta_campaigns"
ON public.meta_campaigns
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- Policy: Organization admins can view their org's campaigns
CREATE POLICY "org_admins_view_org_meta_campaigns"
ON public.meta_campaigns
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
);

-- Policy: Super admins can manage campaigns
CREATE POLICY "super_admins_manage_meta_campaigns"
ON public.meta_campaigns
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));