-- Ensure all existing clients and job listings belong to CR England organization
-- This migration assigns orphaned data to CR England and enforces organization scoping

DO $$
DECLARE
  cr_england_org_id UUID;
BEGIN
  -- Get CR England organization ID
  SELECT id INTO cr_england_org_id 
  FROM public.organizations 
  WHERE slug = 'cr-england' 
  LIMIT 1;

  -- If CR England doesn't exist, create it
  IF cr_england_org_id IS NULL THEN
    INSERT INTO public.organizations (name, slug)
    VALUES ('CR England', 'cr-england')
    RETURNING id INTO cr_england_org_id;
  END IF;

  -- Update all clients without organization_id to belong to CR England
  UPDATE public.clients
  SET organization_id = cr_england_org_id
  WHERE organization_id IS NULL;

  -- Update all job_listings without organization_id to belong to CR England
  UPDATE public.job_listings
  SET organization_id = cr_england_org_id
  WHERE organization_id IS NULL;

  -- Update all applications that reference jobs now belonging to CR England
  -- (ensures data consistency)
  
END $$;

-- Make organization_id NOT NULL on clients table to prevent future orphaned records
ALTER TABLE public.clients 
ALTER COLUMN organization_id SET NOT NULL;

-- Add index for better query performance on organization-scoped queries
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_organization_id ON public.job_listings(organization_id);

-- Ensure RLS policies are correctly enforcing organization boundaries
-- (The existing policies already do this, but let's verify clients table has proper INSERT policy)

DROP POLICY IF EXISTS "Users can manage clients in org" ON public.clients;

CREATE POLICY "Users can view clients in org" 
ON public.clients 
FOR SELECT 
USING (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Users can insert clients in org" 
ON public.clients 
FOR INSERT 
WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Users can update clients in org" 
ON public.clients 
FOR UPDATE 
USING (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Users can delete clients in org" 
ON public.clients 
FOR DELETE 
USING (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));