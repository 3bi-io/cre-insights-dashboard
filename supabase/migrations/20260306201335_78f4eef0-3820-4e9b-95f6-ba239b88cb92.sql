
-- Recruiter availability preferences
CREATE TABLE public.recruiter_availability_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Working hours
  working_hours_start TIME NOT NULL DEFAULT '09:00:00',
  working_hours_end TIME NOT NULL DEFAULT '17:00:00',
  timezone TEXT NOT NULL DEFAULT 'America/Chicago',
  working_days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
  
  -- Booking rules
  buffer_before_minutes INTEGER NOT NULL DEFAULT 5,
  buffer_after_minutes INTEGER NOT NULL DEFAULT 5,
  default_call_duration_minutes INTEGER NOT NULL DEFAULT 15,
  max_daily_callbacks INTEGER NOT NULL DEFAULT 20,
  min_booking_notice_hours INTEGER NOT NULL DEFAULT 1,
  
  -- Preferences
  auto_accept_bookings BOOLEAN NOT NULL DEFAULT true,
  allow_same_day_booking BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_avail_prefs_user ON public.recruiter_availability_preferences(user_id);
CREATE INDEX idx_avail_prefs_org ON public.recruiter_availability_preferences(organization_id);

-- Updated_at trigger
CREATE TRIGGER update_avail_prefs_updated_at
  BEFORE UPDATE ON public.recruiter_availability_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.recruiter_availability_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own availability preferences"
  ON public.recruiter_availability_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "Users can insert own availability preferences"
  ON public.recruiter_availability_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own availability preferences"
  ON public.recruiter_availability_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access availability preferences"
  ON public.recruiter_availability_preferences FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
