-- Add outbound calling configuration to voice_agents table
ALTER TABLE public.voice_agents 
ADD COLUMN IF NOT EXISTS agent_phone_number_id TEXT,
ADD COLUMN IF NOT EXISTS is_outbound_enabled BOOLEAN DEFAULT false;

-- Create outbound_calls table for logging call attempts
CREATE TABLE public.outbound_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  voice_agent_id UUID REFERENCES public.voice_agents(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  call_sid TEXT,
  elevenlabs_conversation_id TEXT,
  duration_seconds INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_outbound_calls_application_id ON public.outbound_calls(application_id);
CREATE INDEX idx_outbound_calls_organization_id ON public.outbound_calls(organization_id);
CREATE INDEX idx_outbound_calls_status ON public.outbound_calls(status);
CREATE INDEX idx_outbound_calls_created_at ON public.outbound_calls(created_at DESC);

-- Enable RLS
ALTER TABLE public.outbound_calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies for outbound_calls
CREATE POLICY "Super admins can manage all outbound calls"
ON public.outbound_calls FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Org admins can view outbound calls in their org"
ON public.outbound_calls FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
);

CREATE POLICY "System can insert outbound calls"
ON public.outbound_calls FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update outbound calls"
ON public.outbound_calls FOR UPDATE
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_outbound_calls_updated_at
BEFORE UPDATE ON public.outbound_calls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically queue outbound call on follow_up status
CREATE OR REPLACE FUNCTION public.trigger_follow_up_outbound_call()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id UUID;
  v_voice_agent_id UUID;
BEGIN
  -- Only trigger when status changes TO 'follow_up' and phone exists
  IF NEW.status = 'follow_up' AND (OLD.status IS NULL OR OLD.status != 'follow_up') AND NEW.phone IS NOT NULL THEN
    -- Get organization ID from job listing
    SELECT jl.organization_id INTO v_org_id
    FROM job_listings jl
    WHERE jl.id = NEW.job_listing_id;
    
    -- Find an enabled outbound voice agent for this organization
    SELECT id INTO v_voice_agent_id
    FROM voice_agents
    WHERE organization_id = v_org_id
      AND is_outbound_enabled = true
      AND agent_phone_number_id IS NOT NULL
      AND status = 'active'
    LIMIT 1;
    
    -- Only queue if we found an enabled voice agent
    IF v_voice_agent_id IS NOT NULL THEN
      INSERT INTO outbound_calls (
        application_id,
        voice_agent_id,
        organization_id,
        phone_number,
        status,
        metadata
      ) VALUES (
        NEW.id,
        v_voice_agent_id,
        v_org_id,
        NEW.phone,
        'queued',
        jsonb_build_object(
          'applicant_name', COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''),
          'triggered_by', 'status_change',
          'previous_status', OLD.status
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on applications table
DROP TRIGGER IF EXISTS trigger_application_follow_up_call ON public.applications;
CREATE TRIGGER trigger_application_follow_up_call
AFTER UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.trigger_follow_up_outbound_call();

-- Add comment for documentation
COMMENT ON TABLE public.outbound_calls IS 'Logs outbound voice calls made via ElevenLabs to applicants';