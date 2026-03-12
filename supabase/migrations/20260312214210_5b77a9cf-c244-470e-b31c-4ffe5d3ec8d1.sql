
-- Calendar invitations table for invite-to-connect flow
CREATE TABLE public.calendar_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  recruiter_email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Index for token lookups
CREATE INDEX idx_calendar_invitations_token ON public.calendar_invitations(token);
CREATE INDEX idx_calendar_invitations_org ON public.calendar_invitations(organization_id);

-- Enable RLS
ALTER TABLE public.calendar_invitations ENABLE ROW LEVEL SECURITY;

-- Admins in same org can view and insert
CREATE POLICY "Org admins can view calendar invitations"
ON public.calendar_invitations
FOR SELECT
TO authenticated
USING (
  organization_id = public.get_user_organization_id()
);

CREATE POLICY "Org admins can insert calendar invitations"
ON public.calendar_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.get_user_organization_id()
  AND invited_by = auth.uid()
);

-- Allow service role full access (edge functions use service client)
