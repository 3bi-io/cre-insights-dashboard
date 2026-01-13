-- Phase 3: Talent Pool / Candidate Database

-- Create talent_pools table for organizing candidates
CREATE TABLE public.talent_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create talent_pool_members junction table
CREATE TABLE public.talent_pool_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES public.talent_pools(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pool_id, application_id)
);

-- Add indexes for performance
CREATE INDEX idx_talent_pools_org ON public.talent_pools(organization_id);
CREATE INDEX idx_talent_pools_created_by ON public.talent_pools(created_by);
CREATE INDEX idx_talent_pool_members_pool ON public.talent_pool_members(pool_id);
CREATE INDEX idx_talent_pool_members_application ON public.talent_pool_members(application_id);

-- Enable RLS
ALTER TABLE public.talent_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_pool_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for talent_pools
CREATE POLICY "Users can view talent pools in their organization"
ON public.talent_pools
FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization_id()
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Users can create talent pools in their organization"
ON public.talent_pools
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = get_user_organization_id()
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Users can update talent pools in their organization"
ON public.talent_pools
FOR UPDATE
TO authenticated
USING (
  organization_id = get_user_organization_id()
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Users can delete talent pools in their organization"
ON public.talent_pools
FOR DELETE
TO authenticated
USING (
  organization_id = get_user_organization_id()
  OR is_super_admin(auth.uid())
);

-- RLS Policies for talent_pool_members
CREATE POLICY "Users can view pool members for their org pools"
ON public.talent_pool_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.talent_pools tp
    WHERE tp.id = pool_id
    AND (tp.organization_id = get_user_organization_id() OR is_super_admin(auth.uid()))
  )
);

CREATE POLICY "Users can add members to their org pools"
ON public.talent_pool_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.talent_pools tp
    WHERE tp.id = pool_id
    AND (tp.organization_id = get_user_organization_id() OR is_super_admin(auth.uid()))
  )
);

CREATE POLICY "Users can remove members from their org pools"
ON public.talent_pool_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.talent_pools tp
    WHERE tp.id = pool_id
    AND (tp.organization_id = get_user_organization_id() OR is_super_admin(auth.uid()))
  )
);

-- Trigger to update talent_pools.updated_at
CREATE TRIGGER update_talent_pools_updated_at
BEFORE UPDATE ON public.talent_pools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();