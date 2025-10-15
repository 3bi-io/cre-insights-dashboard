-- Analytics tables for all job platforms

-- Indeed Analytics
CREATE TABLE IF NOT EXISTS public.indeed_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID NOT NULL,
  employer_id TEXT NOT NULL,
  job_id TEXT,
  date DATE NOT NULL,
  spend NUMERIC DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  applications INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  cpc NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employer_id, job_id, date)
);

ALTER TABLE public.indeed_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own Indeed analytics"
ON public.indeed_analytics
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Adzuna Analytics
CREATE TABLE IF NOT EXISTS public.adzuna_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID NOT NULL,
  campaign_id TEXT NOT NULL,
  job_id TEXT,
  date DATE NOT NULL,
  spend NUMERIC DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  applications INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  cpc NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, job_id, date)
);

ALTER TABLE public.adzuna_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own Adzuna analytics"
ON public.adzuna_analytics
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Craigslist Analytics
CREATE TABLE IF NOT EXISTS public.craigslist_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID NOT NULL,
  posting_id TEXT NOT NULL,
  city TEXT,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(posting_id, date)
);

ALTER TABLE public.craigslist_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own Craigslist analytics"
ON public.craigslist_analytics
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- SimplyHired Analytics
CREATE TABLE IF NOT EXISTS public.simplyhired_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID NOT NULL,
  job_key TEXT NOT NULL,
  date DATE NOT NULL,
  spend NUMERIC DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  applications INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  cpc NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(job_key, date)
);

ALTER TABLE public.simplyhired_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own SimplyHired analytics"
ON public.simplyhired_analytics
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Glassdoor Analytics
CREATE TABLE IF NOT EXISTS public.glassdoor_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID NOT NULL,
  job_id TEXT NOT NULL,
  date DATE NOT NULL,
  spend NUMERIC DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  applications INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  cpc NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(job_id, date)
);

ALTER TABLE public.glassdoor_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own Glassdoor analytics"
ON public.glassdoor_analytics
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Talroo Analytics
CREATE TABLE IF NOT EXISTS public.talroo_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID NOT NULL,
  campaign_id TEXT NOT NULL,
  job_id TEXT,
  date DATE NOT NULL,
  spend NUMERIC DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  applications INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  cpc NUMERIC DEFAULT 0,
  cost_per_application NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, job_id, date)
);

ALTER TABLE public.talroo_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own Talroo analytics"
ON public.talroo_analytics
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- CDL Job Cast Analytics (Adzuna-powered)
CREATE TABLE IF NOT EXISTS public.cdl_jobcast_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID NOT NULL,
  campaign_id TEXT NOT NULL,
  job_id TEXT,
  date DATE NOT NULL,
  spend NUMERIC DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  applications INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  cpc NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, job_id, date)
);

ALTER TABLE public.cdl_jobcast_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own CDL Job Cast analytics"
ON public.cdl_jobcast_analytics
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_platform_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_indeed_analytics_updated_at
  BEFORE UPDATE ON public.indeed_analytics
  FOR EACH ROW EXECUTE FUNCTION update_platform_analytics_updated_at();

CREATE TRIGGER update_adzuna_analytics_updated_at
  BEFORE UPDATE ON public.adzuna_analytics
  FOR EACH ROW EXECUTE FUNCTION update_platform_analytics_updated_at();

CREATE TRIGGER update_craigslist_analytics_updated_at
  BEFORE UPDATE ON public.craigslist_analytics
  FOR EACH ROW EXECUTE FUNCTION update_platform_analytics_updated_at();

CREATE TRIGGER update_simplyhired_analytics_updated_at
  BEFORE UPDATE ON public.simplyhired_analytics
  FOR EACH ROW EXECUTE FUNCTION update_platform_analytics_updated_at();

CREATE TRIGGER update_glassdoor_analytics_updated_at
  BEFORE UPDATE ON public.glassdoor_analytics
  FOR EACH ROW EXECUTE FUNCTION update_platform_analytics_updated_at();

CREATE TRIGGER update_talroo_analytics_updated_at
  BEFORE UPDATE ON public.talroo_analytics
  FOR EACH ROW EXECUTE FUNCTION update_platform_analytics_updated_at();

CREATE TRIGGER update_cdl_jobcast_analytics_updated_at
  BEFORE UPDATE ON public.cdl_jobcast_analytics
  FOR EACH ROW EXECUTE FUNCTION update_platform_analytics_updated_at();