
-- Indeed Sponsored Jobs API campaign tracking
CREATE TABLE public.indeed_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  campaign_id TEXT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  objective TEXT DEFAULT 'APPLY',
  budget_monthly_limit NUMERIC(10,2),
  budget_onetime_limit NUMERIC(10,2),
  start_date DATE,
  end_date DATE,
  jobs_source_id TEXT,
  jobs_query TEXT,
  jobs_to_include TEXT DEFAULT 'ALL',
  tracking_token TEXT,
  total_spend NUMERIC(10,2) DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  total_applies INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_indeed_campaigns_org ON public.indeed_campaigns(organization_id);
CREATE INDEX idx_indeed_campaigns_status ON public.indeed_campaigns(status);
CREATE UNIQUE INDEX idx_indeed_campaigns_external ON public.indeed_campaigns(organization_id, campaign_id) WHERE campaign_id IS NOT NULL;

ALTER TABLE public.indeed_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view campaigns"
  ON public.indeed_campaigns FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Admins can insert campaigns"
  ON public.indeed_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_user_organization_id()
    AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_super_admin(auth.uid()))
  );

CREATE POLICY "Admins can update campaigns"
  ON public.indeed_campaigns FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_user_organization_id()
    AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_super_admin(auth.uid()))
  )
  WITH CHECK (
    organization_id = public.get_user_organization_id()
    AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_super_admin(auth.uid()))
  );

CREATE POLICY "Admins can delete campaigns"
  ON public.indeed_campaigns FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_user_organization_id()
    AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_super_admin(auth.uid()))
  );

CREATE TRIGGER update_indeed_campaigns_updated_at
  BEFORE UPDATE ON public.indeed_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Job-to-campaign assignments
CREATE TABLE public.indeed_campaign_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.indeed_campaigns(id) ON DELETE CASCADE NOT NULL,
  job_listing_id UUID REFERENCES public.job_listings(id) ON DELETE CASCADE NOT NULL,
  indeed_job_key TEXT,
  status TEXT DEFAULT 'active',
  spend NUMERIC(10,2) DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  applies INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, job_listing_id)
);

ALTER TABLE public.indeed_campaign_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view campaign jobs"
  ON public.indeed_campaign_jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.indeed_campaigns ic
      WHERE ic.id = indeed_campaign_jobs.campaign_id
      AND ic.organization_id = public.get_user_organization_id()
    )
  );

CREATE POLICY "Admins can manage campaign jobs"
  ON public.indeed_campaign_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.indeed_campaigns ic
      WHERE ic.id = indeed_campaign_jobs.campaign_id
      AND ic.organization_id = public.get_user_organization_id()
      AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_super_admin(auth.uid()))
    )
  );

CREATE POLICY "Admins can update campaign jobs"
  ON public.indeed_campaign_jobs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.indeed_campaigns ic
      WHERE ic.id = indeed_campaign_jobs.campaign_id
      AND ic.organization_id = public.get_user_organization_id()
      AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_super_admin(auth.uid()))
    )
  );

CREATE POLICY "Admins can delete campaign jobs"
  ON public.indeed_campaign_jobs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.indeed_campaigns ic
      WHERE ic.id = indeed_campaign_jobs.campaign_id
      AND ic.organization_id = public.get_user_organization_id()
      AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_super_admin(auth.uid()))
    )
  );
