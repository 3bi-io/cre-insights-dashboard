-- Create table for ElevenLabs conversations
CREATE TABLE public.elevenlabs_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  voice_agent_id UUID REFERENCES public.voice_agents(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL UNIQUE,
  agent_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for conversation transcripts
CREATE TABLE public.elevenlabs_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.elevenlabs_conversations(id) ON DELETE CASCADE NOT NULL,
  speaker TEXT NOT NULL, -- 'agent' or 'user'
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sequence_number INTEGER NOT NULL,
  confidence_score NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for audio recordings
CREATE TABLE public.elevenlabs_audio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.elevenlabs_conversations(id) ON DELETE CASCADE NOT NULL,
  audio_url TEXT NOT NULL,
  storage_path TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  format TEXT DEFAULT 'mp3',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.elevenlabs_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elevenlabs_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elevenlabs_audio ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Super admins can manage all conversations"
ON public.elevenlabs_conversations
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Org admins can view their org conversations"
ON public.elevenlabs_conversations
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
);

CREATE POLICY "Org admins can manage their org conversations"
ON public.elevenlabs_conversations
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
);

-- RLS Policies for transcripts
CREATE POLICY "Super admins can view all transcripts"
ON public.elevenlabs_transcripts
FOR SELECT
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.elevenlabs_conversations ec
    WHERE ec.id = elevenlabs_transcripts.conversation_id
    AND (
      ec.organization_id = get_user_organization_id()
      AND has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

CREATE POLICY "System can insert transcripts"
ON public.elevenlabs_transcripts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies for audio
CREATE POLICY "Super admins can view all audio"
ON public.elevenlabs_audio
FOR SELECT
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.elevenlabs_conversations ec
    WHERE ec.id = elevenlabs_audio.conversation_id
    AND (
      ec.organization_id = get_user_organization_id()
      AND has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

CREATE POLICY "System can insert audio"
ON public.elevenlabs_audio
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_conversations_org ON public.elevenlabs_conversations(organization_id);
CREATE INDEX idx_conversations_agent ON public.elevenlabs_conversations(voice_agent_id);
CREATE INDEX idx_transcripts_conversation ON public.elevenlabs_transcripts(conversation_id);
CREATE INDEX idx_audio_conversation ON public.elevenlabs_audio(conversation_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_elevenlabs_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_elevenlabs_conversations_timestamp
BEFORE UPDATE ON public.elevenlabs_conversations
FOR EACH ROW
EXECUTE FUNCTION update_elevenlabs_conversations_updated_at();