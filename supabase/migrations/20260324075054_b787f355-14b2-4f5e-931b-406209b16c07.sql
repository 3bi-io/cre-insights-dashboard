-- Fix 1: job_listing_benefits - replace permissive authenticated ALL policy with org-scoped write
DROP POLICY IF EXISTS "Authenticated users can manage job listing benefits" ON public.job_listing_benefits;

-- Org members can manage benefits for their own org's job listings
CREATE POLICY "Org members manage own job listing benefits"
  ON public.job_listing_benefits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_listings jl
      WHERE jl.id = job_listing_benefits.job_id
      AND (
        jl.organization_id = get_user_organization_id()
        OR jl.user_id = auth.uid()
        OR is_super_admin(auth.uid())
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM job_listings jl
      WHERE jl.id = job_listing_benefits.job_id
      AND (
        jl.organization_id = get_user_organization_id()
        OR jl.user_id = auth.uid()
        OR is_super_admin(auth.uid())
      )
    )
  );

-- Service role bypass for edge functions
CREATE POLICY "Service role full access to job_listing_benefits"
  ON public.job_listing_benefits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);