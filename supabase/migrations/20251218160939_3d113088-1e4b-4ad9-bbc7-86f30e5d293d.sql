-- Create call_webhooks table for outbound call completion notifications
CREATE TABLE public.call_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  webhook_url text NOT NULL,
  enabled boolean DEFAULT true,
  event_types text[] DEFAULT ARRAY['completed', 'failed', 'no_answer']::text[],
  secret_key text,
  last_triggered_at timestamp with time zone,
  last_success_at timestamp with time zone,
  last_error text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create call_webhook_logs table for delivery tracking
CREATE TABLE public.call_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES call_webhooks(id) ON DELETE CASCADE,
  outbound_call_id uuid NOT NULL REFERENCES outbound_calls(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  request_payload jsonb NOT NULL,
  response_status integer,
  response_body text,
  error_message text,
  duration_ms integer,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on call_webhooks
ALTER TABLE public.call_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS policies for call_webhooks
CREATE POLICY "Users can view their org call webhooks"
ON public.call_webhooks FOR SELECT
USING (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Users can insert call webhooks for their org"
ON public.call_webhooks FOR INSERT
WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Users can update their org call webhooks"
ON public.call_webhooks FOR UPDATE
USING (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Users can delete their org call webhooks"
ON public.call_webhooks FOR DELETE
USING (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

-- Enable RLS on call_webhook_logs
ALTER TABLE public.call_webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy for call_webhook_logs
CREATE POLICY "Users can view their org call webhook logs"
ON public.call_webhook_logs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM call_webhooks cw 
  WHERE cw.id = call_webhook_logs.webhook_id 
  AND (cw.organization_id = get_user_organization_id() OR is_super_admin(auth.uid()))
));

-- Indexes for performance
CREATE INDEX idx_call_webhooks_org ON public.call_webhooks(organization_id);
CREATE INDEX idx_call_webhooks_enabled ON public.call_webhooks(organization_id, enabled) WHERE enabled = true;
CREATE INDEX idx_call_webhook_logs_webhook ON public.call_webhook_logs(webhook_id);
CREATE INDEX idx_call_webhook_logs_call ON public.call_webhook_logs(outbound_call_id);
CREATE INDEX idx_call_webhook_logs_created ON public.call_webhook_logs(created_at DESC);

-- Updated_at trigger for call_webhooks
CREATE TRIGGER update_call_webhooks_updated_at
  BEFORE UPDATE ON public.call_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();