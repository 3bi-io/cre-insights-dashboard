-- Fix Client Visibility Security: Ensure Organizational Isolation

-- Phase 1: Remove the overly permissive public policy that allows cross-org visibility
DROP POLICY IF EXISTS "Public can view clients with active jobs" ON public.clients;

-- Phase 2: Drop the existing restrictive policy and create a cleaner org-scoped one
DROP POLICY IF EXISTS "Users can view clients with jobs in org" ON public.clients;

-- Create policy: Org users can view ALL clients in their organization (no job requirement)
CREATE POLICY "Users can view clients in their org"
ON public.clients
FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization_id()
  OR is_super_admin(auth.uid())
);