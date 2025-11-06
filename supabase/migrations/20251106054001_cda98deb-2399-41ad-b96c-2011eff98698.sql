-- Create tenstreet_webhook_logs table for tracking webhook deliveries
CREATE TABLE IF NOT EXISTS tenstreet_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id TEXT NOT NULL,
  driver_id TEXT,
  soap_payload TEXT NOT NULL,
  parsed_data JSONB,
  organization_id UUID REFERENCES organizations(id),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  duplicate BOOLEAN DEFAULT FALSE,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_packet ON tenstreet_webhook_logs(packet_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_org ON tenstreet_webhook_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_received ON tenstreet_webhook_logs(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON tenstreet_webhook_logs(processed, received_at DESC);

-- Add missing columns to tenstreet_xchange_requests (including tenstreet_request_id)
ALTER TABLE tenstreet_xchange_requests
ADD COLUMN IF NOT EXISTS tenstreet_request_id TEXT,
ADD COLUMN IF NOT EXISTS extract_url TEXT,
ADD COLUMN IF NOT EXISTS api_type TEXT DEFAULT 'soap';

-- Now create index after column exists
CREATE INDEX IF NOT EXISTS idx_xchange_tenstreet_request ON tenstreet_xchange_requests(tenstreet_request_id) WHERE tenstreet_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_xchange_status ON tenstreet_xchange_requests(status);

-- Enable RLS on webhook logs
ALTER TABLE tenstreet_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Org admins can view webhook logs for their organization
CREATE POLICY "Org admins can view webhook logs" ON tenstreet_webhook_logs
  FOR SELECT
  USING (
    is_super_admin(auth.uid()) OR
    (has_role(auth.uid(), 'admin'::app_role) AND organization_id = get_user_organization_id())
  );

-- Policy: System can insert webhook logs (service role)
CREATE POLICY "System can insert webhook logs" ON tenstreet_webhook_logs
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE tenstreet_webhook_logs IS 'Logs all SOAP webhook callbacks from Tenstreet extractcomplete endpoint';
COMMENT ON COLUMN tenstreet_webhook_logs.packet_id IS 'Tenstreet PacketId - correlates to tenstreet_request_id in xchange_requests';
COMMENT ON COLUMN tenstreet_webhook_logs.duplicate IS 'True if this is a duplicate webhook for the same packet_id';
COMMENT ON COLUMN tenstreet_webhook_logs.processed IS 'True if webhook was successfully processed and database updated';
