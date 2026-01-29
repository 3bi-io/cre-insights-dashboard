-- Create shared_voice_conversations table for tracking shareable links
CREATE TABLE public.shared_voice_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.elevenlabs_conversations(id) ON DELETE CASCADE,
  share_code VARCHAR(12) UNIQUE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  hide_caller_info BOOLEAN DEFAULT false,
  custom_title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_shared_voice_conversations_share_code ON public.shared_voice_conversations(share_code);
CREATE INDEX idx_shared_voice_conversations_conversation_id ON public.shared_voice_conversations(conversation_id);
CREATE INDEX idx_shared_voice_conversations_organization_id ON public.shared_voice_conversations(organization_id);
CREATE INDEX idx_shared_voice_conversations_is_active ON public.shared_voice_conversations(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.shared_voice_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users (admins can manage their org's shares)
CREATE POLICY "Org admins can view their organization's shared conversations"
ON public.shared_voice_conversations
FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid()) OR
  (public.has_role(auth.uid(), 'admin'::app_role) AND organization_id = public.get_user_organization_id())
);

CREATE POLICY "Org admins can create shared conversations for their organization"
ON public.shared_voice_conversations
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_super_admin(auth.uid()) OR
  (public.has_role(auth.uid(), 'admin'::app_role) AND organization_id = public.get_user_organization_id())
);

CREATE POLICY "Org admins can update their organization's shared conversations"
ON public.shared_voice_conversations
FOR UPDATE
TO authenticated
USING (
  public.is_super_admin(auth.uid()) OR
  (public.has_role(auth.uid(), 'admin'::app_role) AND organization_id = public.get_user_organization_id())
);

CREATE POLICY "Org admins can delete their organization's shared conversations"
ON public.shared_voice_conversations
FOR DELETE
TO authenticated
USING (
  public.is_super_admin(auth.uid()) OR
  (public.has_role(auth.uid(), 'admin'::app_role) AND organization_id = public.get_user_organization_id())
);

-- Create public view for safe data exposure (security_invoker = false for public access)
CREATE VIEW public.public_shared_conversation_info 
WITH (security_invoker = false) AS
SELECT 
  svc.id,
  svc.share_code,
  svc.conversation_id,
  svc.custom_title,
  svc.hide_caller_info,
  svc.expires_at,
  ec.started_at,
  ec.duration_seconds,
  ec.status,
  va.agent_name,
  o.name AS organization_name,
  o.logo_url AS organization_logo
FROM public.shared_voice_conversations svc
JOIN public.elevenlabs_conversations ec ON svc.conversation_id = ec.id
LEFT JOIN public.voice_agents va ON ec.voice_agent_id = va.id
LEFT JOIN public.organizations o ON ec.organization_id = o.id
WHERE svc.is_active = true
AND (svc.expires_at IS NULL OR svc.expires_at > now());

-- Create function to generate unique share codes
CREATE OR REPLACE FUNCTION public.generate_share_code()
RETURNS VARCHAR(12)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars VARCHAR := 'abcdefghjkmnpqrstuvwxyz23456789';
  result VARCHAR := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Create function to increment view count (for edge function use)
CREATE OR REPLACE FUNCTION public.increment_share_view_count(p_share_code VARCHAR)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.shared_voice_conversations
  SET view_count = view_count + 1,
      updated_at = now()
  WHERE share_code = p_share_code
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > now());
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_shared_voice_conversations_updated_at
  BEFORE UPDATE ON public.shared_voice_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();