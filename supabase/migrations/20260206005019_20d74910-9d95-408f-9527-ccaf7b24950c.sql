-- Create feed_sync_logs table to track sync history and status
CREATE TABLE IF NOT EXISTS public.feed_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  feed_url TEXT,
  jobs_in_feed INTEGER DEFAULT 0,
  jobs_inserted INTEGER DEFAULT 0,
  jobs_updated INTEGER DEFAULT 0,
  jobs_deactivated INTEGER DEFAULT 0,
  jobs_with_feed_data INTEGER DEFAULT 0,
  sync_duration_ms INTEGER,
  error TEXT,
  sync_type TEXT DEFAULT 'manual',
  triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_feed_sync_logs_created_at ON public.feed_sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_sync_logs_client_id ON public.feed_sync_logs(client_id);

-- Enable RLS
ALTER TABLE public.feed_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies - admins can view sync logs (using user_roles table)
CREATE POLICY "Admins can view feed sync logs" ON public.feed_sync_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Service role can insert feed sync logs" ON public.feed_sync_logs
  FOR INSERT WITH CHECK (true);

-- Create feed_quality_alerts table for monitoring
CREATE TABLE IF NOT EXISTS public.feed_quality_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  current_value NUMERIC,
  threshold_value NUMERIC,
  severity TEXT DEFAULT 'warning',
  message TEXT,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for alerts
CREATE INDEX IF NOT EXISTS idx_feed_quality_alerts_created_at ON public.feed_quality_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_quality_alerts_unack ON public.feed_quality_alerts(acknowledged) WHERE acknowledged = false;

-- Enable RLS
ALTER TABLE public.feed_quality_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for alerts (using user_roles table)
CREATE POLICY "Admins can view feed quality alerts" ON public.feed_quality_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update feed quality alerts" ON public.feed_quality_alerts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Service role can insert feed quality alerts" ON public.feed_quality_alerts
  FOR INSERT WITH CHECK (true);