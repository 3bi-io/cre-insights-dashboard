
-- Add sms_followup_sent flag to outbound_calls
ALTER TABLE public.outbound_calls ADD COLUMN IF NOT EXISTS sms_followup_sent boolean NOT NULL DEFAULT false;

-- Create enum for SMS verification session status
CREATE TYPE public.sms_verification_status AS ENUM ('pending_confirmation', 'confirmed', 'edit_requested', 'expired');

-- Create sms_verification_sessions table
CREATE TABLE public.sms_verification_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  outbound_call_id uuid REFERENCES public.outbound_calls(id) ON DELETE CASCADE NOT NULL,
  phone_number text NOT NULL,
  status sms_verification_status NOT NULL DEFAULT 'pending_confirmation',
  verification_message text,
  client_name text,
  job_listing_id uuid REFERENCES public.job_listings(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Enable RLS
ALTER TABLE public.sms_verification_sessions ENABLE ROW LEVEL SECURITY;

-- Index for phone number lookups (webhook handler)
CREATE INDEX idx_sms_verification_sessions_phone ON public.sms_verification_sessions (phone_number, status);

-- Index for expiry cleanup
CREATE INDEX idx_sms_verification_sessions_expires ON public.sms_verification_sessions (expires_at) WHERE status = 'pending_confirmation';

-- Auto-update updated_at
CREATE TRIGGER update_sms_verification_sessions_updated_at
  BEFORE UPDATE ON public.sms_verification_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: service role only (edge functions)
CREATE POLICY "Service role full access" ON public.sms_verification_sessions
  FOR ALL USING (true) WITH CHECK (true);
