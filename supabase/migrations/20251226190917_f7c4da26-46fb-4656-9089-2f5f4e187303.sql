-- Create job_publishers table to manage all job publishing platforms
CREATE TABLE public.job_publishers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('aggregator', 'niche', 'programmatic', 'social', 'trucking')),
  industries TEXT[] DEFAULT ARRAY['general']::TEXT[],
  integration_type TEXT NOT NULL CHECK (integration_type IN ('xml_feed', 'api', 'partner', 'manual')),
  feed_format TEXT, -- The format parameter to use (indeed, google, generic, etc.)
  feed_url_template TEXT,
  requires_partnership BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  documentation_url TEXT,
  logo_url TEXT,
  description TEXT,
  feed_schema JSONB DEFAULT '{}'::jsonb, -- Required/optional fields
  notes TEXT, -- Internal notes about status/requirements
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_publishers ENABLE ROW LEVEL SECURITY;

-- Anyone can view active publishers
CREATE POLICY "Anyone can view active publishers"
  ON public.job_publishers FOR SELECT
  USING (is_active = true OR is_super_admin(auth.uid()));

-- Only super admins can manage publishers
CREATE POLICY "Super admins can manage publishers"
  ON public.job_publishers FOR ALL
  USING (is_super_admin(auth.uid()));

-- Create organization_publisher_access table to track which publishers orgs use
CREATE TABLE public.organization_publisher_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  publisher_id UUID NOT NULL REFERENCES public.job_publishers(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  api_credentials JSONB DEFAULT '{}'::jsonb,
  feed_url TEXT,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT CHECK (sync_status IN ('pending', 'active', 'error', 'paused')),
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, publisher_id)
);

-- Enable RLS
ALTER TABLE public.organization_publisher_access ENABLE ROW LEVEL SECURITY;

-- Users can view their org's publisher access
CREATE POLICY "Users can view org publisher access"
  ON public.organization_publisher_access FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

-- Admins can manage their org's publisher access
CREATE POLICY "Admins can manage org publisher access"
  ON public.organization_publisher_access FOR ALL
  USING (
    (has_role(auth.uid(), 'admin'::app_role) AND organization_id = get_user_organization_id())
    OR is_super_admin(auth.uid())
  );

-- Create indexes
CREATE INDEX idx_job_publishers_category ON public.job_publishers(category);
CREATE INDEX idx_job_publishers_active ON public.job_publishers(is_active);
CREATE INDEX idx_org_publisher_access_org ON public.organization_publisher_access(organization_id);
CREATE INDEX idx_org_publisher_access_publisher ON public.organization_publisher_access(publisher_id);

-- Create updated_at trigger for job_publishers
CREATE TRIGGER update_job_publishers_updated_at
  BEFORE UPDATE ON public.job_publishers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for organization_publisher_access
CREATE TRIGGER update_org_publisher_access_updated_at
  BEFORE UPDATE ON public.organization_publisher_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed existing + new publishers
INSERT INTO public.job_publishers (slug, name, category, industries, integration_type, feed_format, requires_partnership, is_premium, is_active, documentation_url, logo_url, description, notes) VALUES

-- Major Aggregators (Free/Organic)
('indeed', 'Indeed', 'aggregator', ARRAY['general'], 'xml_feed', 'indeed', false, false, true, 
 'https://www.indeed.com/hire/post-jobs-free', 'https://logos.openai.com/indeed.png',
 'World''s largest job site with 250M+ monthly visitors', 'Free organic listings via XML feed'),

('google-jobs', 'Google for Jobs', 'aggregator', ARRAY['general'], 'xml_feed', 'google', false, false, true,
 'https://developers.google.com/search/docs/appearance/structured-data/job-posting',
 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
 'Job listings appear directly in Google Search results', 'Requires structured data/sitemap'),

('ziprecruiter', 'ZipRecruiter', 'aggregator', ARRAY['general'], 'partner', NULL, true, true, true,
 'https://www.ziprecruiter.com/partner', NULL,
 'AI-powered job matching with 25M+ monthly visitors', 'Requires partner agreement for feed posting'),

('glassdoor', 'Glassdoor', 'aggregator', ARRAY['general'], 'partner', NULL, true, true, true,
 'https://www.glassdoor.com/employers', NULL,
 'Company reviews and salary data with job listings', 'Requires partner agreement'),

('linkedin', 'LinkedIn Jobs', 'aggregator', ARRAY['general', 'tech'], 'partner', NULL, true, true, true,
 'https://business.linkedin.com/talent-solutions', NULL,
 'Professional network with 900M+ members', 'Requires LinkedIn Recruiter or partner integration'),

('careerbuilder', 'CareerBuilder', 'aggregator', ARRAY['general'], 'partner', NULL, true, true, true,
 'https://hiring.careerbuilder.com/', NULL,
 'Major job board with AI-powered matching', 'Requires partnership for XML feed'),

('monster', 'Monster', 'aggregator', ARRAY['general'], 'partner', NULL, true, true, true,
 'https://hiring.monster.com/', NULL,
 'Legacy job board with global presence', 'Requires partnership for posting'),

-- Free Aggregators
('simplyhired', 'SimplyHired', 'aggregator', ARRAY['general'], 'xml_feed', 'indeed', false, false, true,
 'https://www.simplyhired.com/job-posting', NULL,
 'Job aggregator owned by Indeed', 'Accepts Indeed XML format'),

('jooble', 'Jooble', 'aggregator', ARRAY['general'], 'xml_feed', 'generic', false, false, true,
 'https://jooble.org/info/contact', NULL,
 'International job aggregator in 71 countries', 'Accepts generic XML feed'),

('talent-com', 'Talent.com (Neuvoo)', 'aggregator', ARRAY['general'], 'xml_feed', 'talent', false, false, true,
 'https://www.talent.com/employer', NULL,
 'Global job aggregator formerly known as Neuvoo', 'Free XML feed integration'),

('careerjet', 'CareerJet', 'aggregator', ARRAY['general'], 'xml_feed', 'careerjet', false, false, true,
 'https://www.careerjet.com/partners/', NULL,
 'International job search engine in 90+ countries', 'Free XML feed integration'),

('trovit', 'Trovit', 'aggregator', ARRAY['general'], 'xml_feed', 'trovit', false, false, true,
 'https://www.trovit.com/', NULL,
 'Classified ads aggregator including jobs', 'Free XML feed integration'),

('jobrapido', 'JobRapido', 'aggregator', ARRAY['general'], 'xml_feed', 'generic', false, false, true,
 'https://www.jobrapido.com/', NULL,
 'Job search engine in 58 countries', 'Free XML feed integration'),

('recruit-net', 'Recruit.net', 'aggregator', ARRAY['general'], 'xml_feed', 'generic', false, false, true,
 'https://www.recruit.net/', NULL,
 'Asian job search aggregator', 'Free XML feed integration'),

('adzuna', 'Adzuna', 'aggregator', ARRAY['general'], 'xml_feed', 'adzuna', false, false, true,
 'https://www.adzuna.com/partner/', NULL,
 'UK-based job search engine with global reach', 'Free XML feed with analytics'),

('talroo', 'Talroo', 'programmatic', ARRAY['general', 'trucking'], 'api', NULL, true, true, true,
 'https://www.talroo.com/', NULL,
 'AI-powered programmatic job advertising', 'Pay-per-click platform'),

-- Trucking-Specific
('truck-driver-jobs-411', 'Truck Driver Jobs 411', 'trucking', ARRAY['trucking'], 'xml_feed', 'generic', false, false, true,
 NULL, NULL,
 'CDL and truck driver job board', 'Trucking industry specific'),

('newjobs4you', 'NewJobs4You', 'trucking', ARRAY['trucking'], 'xml_feed', 'generic', false, false, true,
 NULL, NULL,
 'Trucking and transportation job board', 'Trucking industry specific'),

('roadwarriors', 'RoadWarriors', 'trucking', ARRAY['trucking'], 'xml_feed', 'generic', false, false, true,
 NULL, NULL,
 'Truck driver employment platform', 'Trucking industry specific'),

('cdl-jobcast', 'CDL JobCast', 'trucking', ARRAY['trucking'], 'api', NULL, true, true, true,
 NULL, NULL,
 'CDL-specific job distribution network', 'Pay-per-click programmatic'),

-- Niche/Industry-Specific
('dice', 'Dice', 'niche', ARRAY['tech'], 'xml_feed', 'dice', false, true, true,
 'https://employer.dice.com/', NULL,
 'Tech-focused job board for IT professionals', 'Tech industry specific, may require partnership'),

('builtin', 'BuiltIn', 'niche', ARRAY['tech'], 'partner', NULL, true, true, true,
 'https://builtin.com/for-employers', NULL,
 'Tech job board focused on startups', 'Requires company profile and partnership'),

('wellfound', 'Wellfound (AngelList Talent)', 'niche', ARRAY['tech'], 'partner', NULL, true, true, true,
 'https://wellfound.com/recruit', NULL,
 'Startup-focused hiring platform', 'Formerly AngelList Talent'),

('snagajob', 'Snagajob', 'niche', ARRAY['hourly', 'retail', 'hospitality'], 'partner', NULL, true, true, true,
 'https://www.snagajob.com/employers/', NULL,
 'Hourly and shift work job board', 'Hourly/retail focus'),

('hcareers', 'Hcareers', 'niche', ARRAY['hospitality'], 'xml_feed', 'generic', false, false, true,
 'https://www.hcareers.com/employer/', NULL,
 'Hospitality industry job board', 'Hotels, restaurants, travel'),

('health-ecareers', 'Health eCareers', 'niche', ARRAY['healthcare'], 'xml_feed', 'generic', false, true, true,
 'https://www.healthecareers.com/employer/', NULL,
 'Healthcare job board for medical professionals', 'Healthcare industry specific'),

('nurse-com', 'Nurse.com', 'niche', ARRAY['healthcare'], 'partner', NULL, true, true, true,
 'https://www.nurse.com/employers', NULL,
 'Nursing-specific job board', 'RN, LPN, nursing jobs only'),

('flexjobs', 'FlexJobs', 'niche', ARRAY['remote'], 'partner', NULL, true, true, true,
 'https://www.flexjobs.com/employers', NULL,
 'Remote and flexible work job board', 'Premium remote job board'),

-- Programmatic Platforms
('appcast', 'Appcast', 'programmatic', ARRAY['general'], 'api', NULL, true, true, true,
 'https://www.appcast.io/', NULL,
 'Programmatic job advertising platform', 'Pay-per-applicant model'),

('recruitics', 'Recruitics', 'programmatic', ARRAY['general'], 'api', NULL, true, true, true,
 'https://www.recruitics.com/', NULL,
 'Recruitment marketing analytics and automation', 'Enterprise programmatic'),

('joveo', 'Joveo', 'programmatic', ARRAY['general'], 'api', NULL, true, true, true,
 'https://www.joveo.com/', NULL,
 'AI-powered programmatic job advertising', 'Advanced analytics'),

('pandologic', 'PandoLogic', 'programmatic', ARRAY['general'], 'api', NULL, true, true, true,
 'https://pandologic.com/', NULL,
 'AI recruitment advertising platform', 'Automated bid optimization'),

-- Social
('meta', 'Meta (Facebook Jobs)', 'social', ARRAY['general'], 'api', NULL, false, false, true,
 'https://www.facebook.com/business/pages/jobs', NULL,
 'Facebook job listings', 'Good for local/hourly positions'),

('x-twitter', 'X (Twitter)', 'social', ARRAY['general', 'tech'], 'manual', NULL, false, false, true,
 NULL, NULL,
 'Social promotion of job listings', 'Manual sharing, not a job feed'),

-- Legacy/Inactive (kept for reference)
('craigslist', 'Craigslist', 'niche', ARRAY['general'], 'manual', NULL, false, false, true,
 'https://www.craigslist.org/about/help/posting_jobs', NULL,
 'Classified ads with job sections', 'Manual posting, location-based');