-- Simulation mode analytics: tracks geo-restricted apply flow engagement
CREATE TABLE public.simulation_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,            -- client-generated UUID per form mount
  event_type TEXT NOT NULL,            -- 'session_start' | 'step_complete' | 'step_dropoff' | 'simulation_complete' | 'waitlist_joined'
  step_number INTEGER,                 -- which step (1-4), NULL for session-level events
  step_name TEXT,                      -- 'personal_info' | 'cdl_info' | 'background' | 'consent'
  country TEXT,
  country_code TEXT,
  job_listing_id UUID,
  time_on_step_ms INTEGER,             -- ms spent on that step before advancing/dropping
  total_steps_completed INTEGER,       -- running count at drop-off time
  metadata JSONB,                      -- flexible extra context
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_simulation_events_session_id ON public.simulation_events(session_id);
CREATE INDEX idx_simulation_events_event_type  ON public.simulation_events(event_type);
CREATE INDEX idx_simulation_events_country_code ON public.simulation_events(country_code);
CREATE INDEX idx_simulation_events_created_at  ON public.simulation_events(created_at DESC);

-- RLS: anyone (anon) can insert, only super admins can read
ALTER TABLE public.simulation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log simulation events"
  ON public.simulation_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Super admins can read simulation events"
  ON public.simulation_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
    )
  );
