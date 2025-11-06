-- Create client_webhooks table
CREATE TABLE client_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  webhook_url text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  event_types text[] DEFAULT ARRAY['created', 'updated']::text[],
  secret_key text,
  last_triggered_at timestamp with time zone,
  last_success_at timestamp with time zone,
  last_error text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(client_id)
);

-- Enable RLS
ALTER TABLE client_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_webhooks
CREATE POLICY "Users can view webhooks in their org"
  ON client_webhooks FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Users can create webhooks in their org"
  ON client_webhooks FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND organization_id = get_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM clients 
      WHERE id = client_webhooks.client_id 
      AND organization_id = client_webhooks.organization_id
    )
  );

CREATE POLICY "Users can update webhooks in their org"
  ON client_webhooks FOR UPDATE
  USING (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Users can delete webhooks in their org"
  ON client_webhooks FOR DELETE
  USING (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_client_webhooks_client_id ON client_webhooks(client_id);
CREATE INDEX idx_client_webhooks_org_id ON client_webhooks(organization_id);
CREATE INDEX idx_client_webhooks_enabled ON client_webhooks(enabled) WHERE enabled = true;

-- Create client_webhook_logs table
CREATE TABLE client_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES client_webhooks(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  request_payload jsonb NOT NULL,
  response_status integer,
  response_body text,
  error_message text,
  duration_ms integer,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE client_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs for their org webhooks"
  ON client_webhook_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_webhooks cw
      WHERE cw.id = client_webhook_logs.webhook_id
      AND (cw.organization_id = get_user_organization_id() OR is_super_admin(auth.uid()))
    )
  );

CREATE POLICY "System can insert logs"
  ON client_webhook_logs FOR INSERT
  WITH CHECK (true);

-- Create indexes for logs
CREATE INDEX idx_client_webhook_logs_webhook_id ON client_webhook_logs(webhook_id);
CREATE INDEX idx_client_webhook_logs_application_id ON client_webhook_logs(application_id);
CREATE INDEX idx_client_webhook_logs_created_at ON client_webhook_logs(created_at DESC);

-- Trigger to update updated_at on client_webhooks
CREATE OR REPLACE FUNCTION update_client_webhook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_client_webhooks_updated_at
  BEFORE UPDATE ON client_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_client_webhook_updated_at();