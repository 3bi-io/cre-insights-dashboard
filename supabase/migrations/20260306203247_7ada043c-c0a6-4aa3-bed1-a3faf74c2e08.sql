
-- =====================================================
-- SECURITY FIX: Applications table - restrict to authenticated only
-- =====================================================

-- Drop all existing policies on applications that use {public} role
DROP POLICY IF EXISTS "Job owners can view applications for their jobs" ON public.applications;
DROP POLICY IF EXISTS "Job owners can update basic application data" ON public.applications;
DROP POLICY IF EXISTS "Org admins can view applications in their org" ON public.applications;
DROP POLICY IF EXISTS "Org admins can update basic application data" ON public.applications;
DROP POLICY IF EXISTS "Recruiters can view assigned applications" ON public.applications;
DROP POLICY IF EXISTS "Recruiters can update assigned applications" ON public.applications;
DROP POLICY IF EXISTS "Recruiters can update their assigned applications" ON public.applications;
DROP POLICY IF EXISTS "Super admins can view all applications" ON public.applications;
DROP POLICY IF EXISTS "Super admins can update all applications" ON public.applications;
DROP POLICY IF EXISTS "Super admins full access" ON public.applications;
DROP POLICY IF EXISTS "Users can create applications for their job listings" ON public.applications;
DROP POLICY IF EXISTS "Users can delete applications for their job listings" ON public.applications;
DROP POLICY IF EXISTS "Org admins can delete applications in org" ON public.applications;
DROP POLICY IF EXISTS "Recruiters can update org applications" ON public.applications;
DROP POLICY IF EXISTS "Recruiters can view org applications" ON public.applications;

-- Recreate all policies with {authenticated} role instead of {public}

-- SELECT policies
CREATE POLICY "auth_super_admins_view_all_applications"
  ON public.applications FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "auth_org_admins_view_org_applications"
  ON public.applications FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM job_listings jl
      WHERE jl.id = applications.job_listing_id
      AND jl.organization_id = public.get_user_organization_id()
    )
  );

CREATE POLICY "auth_job_owners_view_applications"
  ON public.applications FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_listings jl
      WHERE jl.id = applications.job_listing_id
      AND jl.user_id = auth.uid()
    )
  );

CREATE POLICY "auth_recruiters_view_assigned_applications"
  ON public.applications FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recruiters r
      WHERE r.id = applications.recruiter_id
      AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "auth_recruiters_view_org_applications"
  ON public.applications FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'recruiter'::app_role)
    AND job_listing_id IN (
      SELECT id FROM job_listings WHERE organization_id = public.get_user_organization_id()
    )
  );

-- UPDATE policies
CREATE POLICY "auth_super_admins_update_applications"
  ON public.applications FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "auth_org_admins_update_applications"
  ON public.applications FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM job_listings jl
      WHERE jl.id = applications.job_listing_id
      AND jl.organization_id = public.get_user_organization_id()
    )
  );

CREATE POLICY "auth_job_owners_update_applications"
  ON public.applications FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_listings jl
      WHERE jl.id = applications.job_listing_id
      AND jl.user_id = auth.uid()
    )
  );

CREATE POLICY "auth_recruiters_update_assigned_applications"
  ON public.applications FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recruiters r
      WHERE r.id = applications.recruiter_id
      AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "auth_recruiters_update_org_applications"
  ON public.applications FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'recruiter'::app_role)
    AND job_listing_id IN (
      SELECT id FROM job_listings WHERE organization_id = public.get_user_organization_id()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'recruiter'::app_role)
    AND job_listing_id IN (
      SELECT id FROM job_listings WHERE organization_id = public.get_user_organization_id()
    )
  );

-- INSERT: Only authenticated users who own the job listing, or service_role (edge functions)
CREATE POLICY "auth_users_insert_applications"
  ON public.applications FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM job_listings
      WHERE job_listings.id = applications.job_listing_id
      AND job_listings.user_id = auth.uid()
    )
  );

-- Service role can always insert (for edge functions handling public form submissions)
CREATE POLICY "service_role_full_access_applications"
  ON public.applications FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- DELETE policies
CREATE POLICY "auth_org_admins_delete_applications"
  ON public.applications FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM job_listings jl
      WHERE jl.id = applications.job_listing_id
      AND jl.organization_id = public.get_user_organization_id()
    )
  );

CREATE POLICY "auth_job_owners_delete_applications"
  ON public.applications FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_listings jl
      WHERE jl.id = applications.job_listing_id
      AND jl.user_id = auth.uid()
    )
  );

-- =====================================================
-- SECURITY FIX: Organizations table - clean up anon policy
-- =====================================================

-- The anon policy with qual=false is redundant and misleading. Remove it.
-- The public_organization_info view handles public access via security_invoker=false.
DROP POLICY IF EXISTS "View can access for public_organization_info" ON public.organizations;

-- Remove duplicate SELECT policies on organizations (keep one per role)
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Super admins can view all organizations" ON public.organizations;

-- The remaining policies are:
-- "Members can view their organization" (authenticated, id = get_user_organization_id())
-- "Super admins can manage all organizations" (authenticated, ALL)  
-- "Super admins have full access to organizations" (authenticated, ALL)
-- "Admins can manage their organization" (authenticated, ALL)
-- "Admins can update their organization" (authenticated, UPDATE)

-- Remove redundant super admin policies (keep just one ALL policy)
DROP POLICY IF EXISTS "Super admins can manage all organizations" ON public.organizations;

-- =====================================================
-- SECURITY FIX: public_client_info view - set security_invoker=false explicitly
-- This is intentionally a security definer view for the public /clients page
-- =====================================================

DROP VIEW IF EXISTS public.public_client_info;
CREATE VIEW public.public_client_info
WITH (security_invoker = false)
AS
SELECT DISTINCT ON (c.id)
  c.id,
  c.name,
  c.logo_url,
  c.city,
  c.state,
  (SELECT count(*) FROM job_listings jl2 
   WHERE jl2.client_id = c.id 
   AND jl2.status = 'active' 
   AND (jl2.is_hidden = false OR jl2.is_hidden IS NULL))::integer AS job_count,
  o.industry_vertical
FROM clients c
JOIN job_listings jl ON jl.client_id = c.id
JOIN organizations o ON c.organization_id = o.id
WHERE jl.status = 'active'
  AND (jl.is_hidden = false OR jl.is_hidden IS NULL)
  AND c.status = 'active'
  AND o.slug <> 'acme';

-- Grant SELECT on public views to anon for public pages
GRANT SELECT ON public.public_client_info TO anon;
GRANT SELECT ON public.public_client_info TO authenticated;
GRANT SELECT ON public.public_organization_info TO anon;
GRANT SELECT ON public.public_organization_info TO authenticated;
