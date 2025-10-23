
-- Grant organization admins full access to manage all resources in their organization

-- Job Listings: Allow org admins to update and delete any job listing in their org
DROP POLICY IF EXISTS "Org admins can update all job listings in org" ON public.job_listings;
CREATE POLICY "Org admins can update all job listings in org"
ON public.job_listings
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
);

DROP POLICY IF EXISTS "Org admins can delete all job listings in org" ON public.job_listings;
CREATE POLICY "Org admins can delete all job listings in org"
ON public.job_listings
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
);

-- Applications: Allow org admins to delete applications in their org
DROP POLICY IF EXISTS "Org admins can delete applications in org" ON public.applications;
CREATE POLICY "Org admins can delete applications in org"
ON public.applications
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM job_listings jl 
    WHERE jl.id = applications.job_listing_id 
    AND jl.organization_id = get_user_organization_id()
  )
);

-- Application Documents: Allow org admins to insert documents for their org's applications
DROP POLICY IF EXISTS "Org admins can insert documents for org applications" ON public.application_documents;
CREATE POLICY "Org admins can insert documents for org applications"
ON public.application_documents
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM applications a
    JOIN job_listings jl ON a.job_listing_id = jl.id
    WHERE a.id = application_documents.application_id 
    AND jl.organization_id = get_user_organization_id()
  )
);

-- Recruiters: Allow org admins to manage all recruiters in their org
DROP POLICY IF EXISTS "Org admins can manage all recruiters in org" ON public.recruiters;
CREATE POLICY "Org admins can manage all recruiters in org"
ON public.recruiters
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
);

-- Campaigns: Allow org admins to manage all campaigns in their org
DROP POLICY IF EXISTS "Org admins can manage all campaigns in org" ON public.campaigns;
CREATE POLICY "Org admins can manage all campaigns in org"
ON public.campaigns
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
);

-- Budget Allocations: Allow org admins to manage all budget allocations in their org
DROP POLICY IF EXISTS "Org admins can manage all budget allocations in org" ON public.budget_allocations;
CREATE POLICY "Org admins can manage all budget allocations in org"
ON public.budget_allocations
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
);

-- Profiles: Allow org admins to view and update profiles in their org
DROP POLICY IF EXISTS "Org admins can view profiles in org" ON public.profiles;
CREATE POLICY "Org admins can view profiles in org"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
);

DROP POLICY IF EXISTS "Org admins can update profiles in org" ON public.profiles;
CREATE POLICY "Org admins can update profiles in org"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
);
