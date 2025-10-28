-- Create page_views table for tracking individual page visits
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create visitor_sessions table for tracking sessions
CREATE TABLE IF NOT EXISTS public.visitor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  visitor_id TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  page_count INTEGER DEFAULT 1,
  source TEXT,
  device_type TEXT,
  country TEXT,
  bounced BOOLEAN DEFAULT false
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON public.page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON public.page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_organization_id ON public.page_views(organization_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_started_at ON public.visitor_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_organization_id ON public.visitor_sessions(organization_id);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for page_views (allow service role to insert anonymously)
CREATE POLICY "Allow anonymous page view tracking"
  ON public.page_views
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view page views"
  ON public.page_views
  FOR SELECT
  USING (
    is_super_admin(auth.uid()) OR 
    (has_role(auth.uid(), 'admin'::app_role) AND organization_id = get_user_organization_id())
  );

-- RLS Policies for visitor_sessions
CREATE POLICY "Allow anonymous session tracking"
  ON public.visitor_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view sessions"
  ON public.visitor_sessions
  FOR SELECT
  USING (
    is_super_admin(auth.uid()) OR 
    (has_role(auth.uid(), 'admin'::app_role) AND organization_id = get_user_organization_id())
  );

-- Function to classify traffic source
CREATE OR REPLACE FUNCTION public.classify_traffic_source(referrer TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  IF referrer IS NULL OR referrer = '' THEN
    RETURN 'Direct';
  ELSIF referrer ILIKE '%google%' OR referrer ILIKE '%bing%' OR referrer ILIKE '%yahoo%' THEN
    RETURN 'Search';
  ELSIF referrer ILIKE '%facebook%' OR referrer ILIKE '%twitter%' OR referrer ILIKE '%linkedin%' OR referrer ILIKE '%instagram%' THEN
    RETURN 'Social';
  ELSIF referrer ILIKE '%mail%' THEN
    RETURN 'Email';
  ELSE
    RETURN 'Referral';
  END IF;
END;
$$;