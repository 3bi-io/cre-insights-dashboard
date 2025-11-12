-- CRITICAL SECURITY HARDENING: Phase 1 - Meta Tables Organization Scoping
-- This migration adds organization_id to Meta tables to prevent cross-organization data leakage

-- Add organization_id to meta_ad_accounts
ALTER TABLE public.meta_ad_accounts 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add organization_id to meta_campaigns
ALTER TABLE public.meta_campaigns 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add organization_id to meta_ad_sets
ALTER TABLE public.meta_ad_sets 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add organization_id to meta_ads
ALTER TABLE public.meta_ads 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add organization_id to meta_daily_spend
ALTER TABLE public.meta_daily_spend 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Backfill organization_id from user profiles (for existing data)
UPDATE public.meta_ad_accounts 
SET organization_id = (SELECT organization_id FROM public.profiles WHERE id = meta_ad_accounts.user_id)
WHERE organization_id IS NULL;

UPDATE public.meta_campaigns 
SET organization_id = (SELECT organization_id FROM public.profiles WHERE id = meta_campaigns.user_id)
WHERE organization_id IS NULL;

UPDATE public.meta_ad_sets 
SET organization_id = (SELECT organization_id FROM public.profiles WHERE id = meta_ad_sets.user_id)
WHERE organization_id IS NULL;

UPDATE public.meta_ads 
SET organization_id = (SELECT organization_id FROM public.profiles WHERE id = meta_ads.user_id)
WHERE organization_id IS NULL;

UPDATE public.meta_daily_spend 
SET organization_id = (SELECT organization_id FROM public.profiles WHERE id = meta_daily_spend.user_id)
WHERE organization_id IS NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_meta_ad_accounts_org ON public.meta_ad_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_org ON public.meta_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_ad_sets_org ON public.meta_ad_sets(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_ads_org ON public.meta_ads(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_daily_spend_org ON public.meta_daily_spend(organization_id);

-- Enable RLS on Meta tables (if not already enabled)
ALTER TABLE public.meta_ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_ad_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_daily_spend ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own Meta ad accounts" ON public.meta_ad_accounts;
DROP POLICY IF EXISTS "Users can insert their own Meta ad accounts" ON public.meta_ad_accounts;
DROP POLICY IF EXISTS "Users can update their own Meta ad accounts" ON public.meta_ad_accounts;
DROP POLICY IF EXISTS "Users can delete their own Meta ad accounts" ON public.meta_ad_accounts;

DROP POLICY IF EXISTS "Users can view their own Meta campaigns" ON public.meta_campaigns;
DROP POLICY IF EXISTS "Users can insert their own Meta campaigns" ON public.meta_campaigns;
DROP POLICY IF EXISTS "Users can update their own Meta campaigns" ON public.meta_campaigns;
DROP POLICY IF EXISTS "Users can delete their own Meta campaigns" ON public.meta_campaigns;

DROP POLICY IF EXISTS "Users can view their own Meta ad sets" ON public.meta_ad_sets;
DROP POLICY IF EXISTS "Users can insert their own Meta ad sets" ON public.meta_ad_sets;
DROP POLICY IF EXISTS "Users can update their own Meta ad sets" ON public.meta_ad_sets;
DROP POLICY IF EXISTS "Users can delete their own Meta ad sets" ON public.meta_ad_sets;

DROP POLICY IF EXISTS "Users can view their own Meta ads" ON public.meta_ads;
DROP POLICY IF EXISTS "Users can insert their own Meta ads" ON public.meta_ads;
DROP POLICY IF EXISTS "Users can update their own Meta ads" ON public.meta_ads;
DROP POLICY IF EXISTS "Users can delete their own Meta ads" ON public.meta_ads;

DROP POLICY IF EXISTS "Users can view their own Meta daily spend" ON public.meta_daily_spend;
DROP POLICY IF EXISTS "Users can insert their own Meta daily spend" ON public.meta_daily_spend;
DROP POLICY IF EXISTS "Users can update their own Meta daily spend" ON public.meta_daily_spend;
DROP POLICY IF EXISTS "Users can delete their own Meta daily spend" ON public.meta_daily_spend;

-- Create organization-scoped RLS policies for meta_ad_accounts
CREATE POLICY "Users can view Meta ad accounts in their organization"
ON public.meta_ad_accounts FOR SELECT
TO authenticated
USING (
  organization_id = public.get_user_organization_id() OR
  public.is_super_admin(auth.uid())
);

CREATE POLICY "Users can insert Meta ad accounts in their organization"
ON public.meta_ad_accounts FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.get_user_organization_id() OR
  public.is_super_admin(auth.uid())
);

CREATE POLICY "Users can update Meta ad accounts in their organization"
ON public.meta_ad_accounts FOR UPDATE
TO authenticated
USING (
  organization_id = public.get_user_organization_id() OR
  public.is_super_admin(auth.uid())
);

CREATE POLICY "Users can delete Meta ad accounts in their organization"
ON public.meta_ad_accounts FOR DELETE
TO authenticated
USING (
  organization_id = public.get_user_organization_id() OR
  public.is_super_admin(auth.uid())
);

-- Create organization-scoped RLS policies for meta_campaigns
CREATE POLICY "Users can view Meta campaigns in their organization"
ON public.meta_campaigns FOR SELECT
TO authenticated
USING (
  organization_id = public.get_user_organization_id() OR
  public.is_super_admin(auth.uid())
);

CREATE POLICY "Users can insert Meta campaigns in their organization"
ON public.meta_campaigns FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.get_user_organization_id() OR
  public.is_super_admin(auth.uid())
);

CREATE POLICY "Users can update Meta campaigns in their organization"
ON public.meta_campaigns FOR UPDATE
TO authenticated
USING (
  organization_id = public.get_user_organization_id() OR
  public.is_super_admin(auth.uid())
);

CREATE POLICY "Users can delete Meta campaigns in their organization"
ON public.meta_campaigns FOR DELETE
TO authenticated
USING (
  organization_id = public.get_user_organization_id() OR
  public.is_super_admin(auth.uid())
);

-- Create organization-scoped RLS policies for meta_ad_sets
CREATE POLICY "Users can view Meta ad sets in their organization"
ON public.meta_ad_sets FOR SELECT
TO authenticated
USING (
  organization_id = public.get_user_organization_id() OR
  public.is_super_admin(auth.uid())
);

CREATE POLICY "Users can insert Meta ad sets in their organization"
ON public.meta_ad_sets FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.get_user_organization_id() OR
  public.is_super_admin(auth.uid())
);

CREATE POLICY "Users can update Meta ad sets in their organization"
ON public.meta_ad_sets FOR UPDATE
TO authenticated
USING (
  organization_id = public.get_user_organization_id() OR
  public.is_super_admin(auth.uid())
);

CREATE POLICY "Users can delete Meta ad sets in their organization"
ON public.meta_ad_sets FOR DELETE
TO authenticated
USING (
  organization_id = public.get_user_organization_id() OR
  public.is_super_admin(auth.uid())
);

-- Create organization-scoped RLS policies for meta_ads
CREATE POLICY "Users can view Meta ads in their organization"
ON public.meta_ads FOR SELECT
TO authenticated
USING (
  organization_id = public.get_user_organization_id() OR
  public.is_super_admin(auth.uid())
);

CREATE POLICY "Users can insert Meta ads in their organization"
ON public.meta_ads FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.get_user_organization_id() OR
  public.is_super_admin(auth.uid())
);

CREATE POLICY "Users can update Meta ads in their organization"
ON public.meta_ads FOR UPDATE
TO authenticated
USING (
  organization_id = public.get_user_organization_id() OR
  public.is_super_admin(auth.uid())
);

CREATE POLICY "Users can delete Meta ads in their organization"
ON public.meta_ads FOR DELETE
TO authenticated
USING (
  organization_id = public.get_user_organization_id() OR
  public.is_super_admin(auth.uid())
);

-- Create organization-scoped RLS policies for meta_daily_spend
CREATE POLICY "Users can view Meta daily spend in their organization"
ON public.meta_daily_spend FOR SELECT
TO authenticated
USING (
  organization_id = public.get_user_organization_id() OR
  public.is_super_admin(auth.uid())
);

CREATE POLICY "Users can insert Meta daily spend in their organization"
ON public.meta_daily_spend FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.get_user_organization_id() OR
  public.is_super_admin(auth.uid())
);

CREATE POLICY "Users can update Meta daily spend in their organization"
ON public.meta_daily_spend FOR UPDATE
TO authenticated
USING (
  organization_id = public.get_user_organization_id() OR
  public.is_super_admin(auth.uid())
);

CREATE POLICY "Users can delete Meta daily spend in their organization"
ON public.meta_daily_spend FOR DELETE
TO authenticated
USING (
  organization_id = public.get_user_organization_id() OR
  public.is_super_admin(auth.uid())
);

-- Add comment documenting the security improvement
COMMENT ON COLUMN public.meta_ad_accounts.organization_id IS 'Organization scoping to prevent cross-organization data leakage';
COMMENT ON COLUMN public.meta_campaigns.organization_id IS 'Organization scoping to prevent cross-organization data leakage';
COMMENT ON COLUMN public.meta_ad_sets.organization_id IS 'Organization scoping to prevent cross-organization data leakage';
COMMENT ON COLUMN public.meta_ads.organization_id IS 'Organization scoping to prevent cross-organization data leakage';
COMMENT ON COLUMN public.meta_daily_spend.organization_id IS 'Organization scoping to prevent cross-organization data leakage';