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
END $$;

-- Make organization_id NOT NULL on clients table to prevent future orphaned records
ALTER TABLE public.clients 
ALTER COLUMN organization_id SET NOT NULL;

-- Add indexes for better query performance on organization-scoped queries
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_organization_id ON public.job_listings(organization_id);