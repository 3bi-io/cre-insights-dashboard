-- SMS audit log table for all inbound and outbound SMS operations
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number text NOT NULL,
  to_number text NOT NULL,
  body text,
  twilio_sid text,
  status text DEFAULT 'sent',
  error_message text,
  error_code integer,
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  conversation_id uuid,
  message_id uuid,
  session_id uuid,
  metadata jsonb DEFAULT '{}',
  duration_ms integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_sms_logs_from_number ON public.sms_logs(from_number);
CREATE INDEX idx_sms_logs_to_number ON public.sms_logs(to_number);
CREATE INDEX idx_sms_logs_created_at ON public.sms_logs(created_at DESC);
CREATE INDEX idx_sms_logs_application_id ON public.sms_logs(application_id);

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to sms_logs"
  ON public.sms_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view sms_logs"
  ON public.sms_logs FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );