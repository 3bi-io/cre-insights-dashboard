
-- Recruiter calendar connections (Nylas OAuth grants)
CREATE TABLE public.recruiter_calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'nylas',
  nylas_grant_id TEXT NOT NULL,
  calendar_id TEXT,
  email TEXT,
  provider_type TEXT, -- google, microsoft, icloud
  status TEXT NOT NULL DEFAULT 'active',
  scopes TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Scheduled callbacks booked by AI agents
CREATE TABLE public.scheduled_callbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  recruiter_user_id UUID NOT NULL REFERENCES auth.users(id),
  calendar_connection_id UUID REFERENCES public.recruiter_calendar_connections(id) ON DELETE SET NULL,
  nylas_event_id TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, completed, cancelled, no_show
  booking_source TEXT DEFAULT 'ai_agent', -- ai_agent, manual, reschedule
  notes TEXT,
  sms_confirmation_sent BOOLEAN DEFAULT false,
  digest_email_sent BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_calendar_connections_user ON public.recruiter_calendar_connections(user_id);
CREATE INDEX idx_calendar_connections_org ON public.recruiter_calendar_connections(organization_id);
CREATE INDEX idx_scheduled_callbacks_recruiter ON public.scheduled_callbacks(recruiter_user_id);
CREATE INDEX idx_scheduled_callbacks_org ON public.scheduled_callbacks(organization_id);
CREATE INDEX idx_scheduled_callbacks_start ON public.scheduled_callbacks(scheduled_start);
CREATE INDEX idx_scheduled_callbacks_status ON public.scheduled_callbacks(status);

-- Updated_at triggers
CREATE TRIGGER update_calendar_connections_updated_at
  BEFORE UPDATE ON public.recruiter_calendar_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_callbacks_updated_at
  BEFORE UPDATE ON public.scheduled_callbacks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.recruiter_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_callbacks ENABLE ROW LEVEL SECURITY;

-- Calendar connections: users see own, admins see org
CREATE POLICY "Users can view own calendar connections"
  ON public.recruiter_calendar_connections FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "Users can insert own calendar connections"
  ON public.recruiter_calendar_connections FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own calendar connections"
  ON public.recruiter_calendar_connections FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own calendar connections"
  ON public.recruiter_calendar_connections FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Scheduled callbacks: recruiters see own, admins see org
CREATE POLICY "Recruiters can view own scheduled callbacks"
  ON public.scheduled_callbacks FOR SELECT
  TO authenticated
  USING (
    recruiter_user_id = auth.uid() 
    OR public.is_super_admin(auth.uid())
    OR (public.has_role(auth.uid(), 'admin'::app_role) AND organization_id = public.get_user_organization_id())
  );

CREATE POLICY "Authenticated users can insert scheduled callbacks"
  ON public.scheduled_callbacks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Recruiters can update own scheduled callbacks"
  ON public.scheduled_callbacks FOR UPDATE
  TO authenticated
  USING (
    recruiter_user_id = auth.uid() 
    OR public.is_super_admin(auth.uid())
  );

-- Service role needs to insert callbacks from edge functions
CREATE POLICY "Service role full access calendar connections"
  ON public.recruiter_calendar_connections FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access scheduled callbacks"
  ON public.scheduled_callbacks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
