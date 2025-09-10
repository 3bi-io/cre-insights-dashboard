-- Tighten RLS for sensitive applicant data in public.applications
-- 1) Drop overly broad org-wide SELECT policy
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'applications' 
      AND policyname = 'Users can view applications in their organization'
  ) THEN
    DROP POLICY "Users can view applications in their organization" ON public.applications;
  END IF;
END $$;

-- 2) Create narrower SELECT policy for org admins only
CREATE POLICY "Admins can view applications in their organization"
ON public.applications
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.job_listings jl
    WHERE jl.id = applications.job_listing_id
      AND jl.organization_id = get_user_organization_id()
  )
);

-- Notes:
-- - Existing SELECT policy for recruiters assigned to applications remains in place
--   ("Recruiters can view their assigned applications").
-- - Existing super admin SELECT policy remains unchanged.
-- - No changes to INSERT/UPDATE/DELETE behavior to avoid breaking workflows.
