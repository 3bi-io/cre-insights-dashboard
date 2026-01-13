-- Phase 4: Email Communication Tracking

-- Create communication_logs table for tracking all communications
CREATE TABLE public.communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'call')),
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  recipient TEXT NOT NULL,
  subject TEXT,
  body_preview TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  external_id TEXT,
  metadata JSONB DEFAULT '{}',
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- Add indexes for performance
CREATE INDEX idx_communication_logs_org ON public.communication_logs(organization_id);
CREATE INDEX idx_communication_logs_application ON public.communication_logs(application_id);
CREATE INDEX idx_communication_logs_channel ON public.communication_logs(channel);
CREATE INDEX idx_communication_logs_status ON public.communication_logs(status);
CREATE INDEX idx_communication_logs_sent_at ON public.communication_logs(sent_at DESC);
CREATE INDEX idx_communication_logs_external_id ON public.communication_logs(external_id) WHERE external_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view communication logs in their organization"
ON public.communication_logs
FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization_id()
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Users can create communication logs in their organization"
ON public.communication_logs
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = get_user_organization_id()
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Users can update communication logs in their organization"
ON public.communication_logs
FOR UPDATE
TO authenticated
USING (
  organization_id = get_user_organization_id()
  OR is_super_admin(auth.uid())
);

-- Service role policy for webhook updates (external_id based)
CREATE POLICY "Service role can update via external_id"
ON public.communication_logs
FOR UPDATE
TO service_role
USING (true);