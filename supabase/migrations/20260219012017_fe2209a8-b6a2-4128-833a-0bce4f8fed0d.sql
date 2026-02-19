
-- International waitlist for non-Americas users who express interest
CREATE TABLE public.international_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  country TEXT,
  country_code TEXT,
  message TEXT,
  job_listing_id UUID REFERENCES public.job_listings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Basic index for email lookup / dedup checks
CREATE INDEX idx_international_waitlist_email ON public.international_waitlist(email);
CREATE INDEX idx_international_waitlist_created_at ON public.international_waitlist(created_at DESC);

-- RLS: public inserts (anon users can join), only admins can read
ALTER TABLE public.international_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the waitlist"
  ON public.international_waitlist
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Super admins can view waitlist"
  ON public.international_waitlist
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
    )
  );
