-- Create feed_access_logs table to track XML feed requests
CREATE TABLE public.feed_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feed_type TEXT NOT NULL,
  platform TEXT,
  job_group_id UUID REFERENCES public.job_groups(id) ON DELETE CASCADE,
  request_ip TEXT,
  user_agent TEXT,
  job_count INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for query performance
CREATE INDEX idx_feed_access_organization ON public.feed_access_logs(organization_id);
CREATE INDEX idx_feed_access_user ON public.feed_access_logs(user_id);
CREATE INDEX idx_feed_access_created ON public.feed_access_logs(created_at DESC);
CREATE INDEX idx_feed_access_feed_type ON public.feed_access_logs(feed_type);
CREATE INDEX idx_feed_access_platform ON public.feed_access_logs(platform);

-- Enable RLS
ALTER TABLE public.feed_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view logs for their organization"
  ON public.feed_access_logs
  FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Super admins can view all feed logs"
  ON public.feed_access_logs
  FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Service role can insert feed logs"
  ON public.feed_access_logs
  FOR INSERT
  WITH CHECK (true);

-- Auto-delete logs older than 90 days for data retention
CREATE OR REPLACE FUNCTION public.cleanup_old_feed_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.feed_access_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;