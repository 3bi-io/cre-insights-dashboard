-- Create voice agents table for organization-specific agent configurations
CREATE TABLE IF NOT EXISTS public.voice_agents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  agent_name text NOT NULL,
  agent_id text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.voice_agents ENABLE ROW LEVEL SECURITY;

-- Create policies for voice agents
CREATE POLICY "Super admins can manage all voice agents" 
ON public.voice_agents 
FOR ALL 
USING (auth.uid() IS NOT NULL AND is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage their org voice agents" 
ON public.voice_agents 
FOR ALL 
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'admin'::app_role) AND 
  organization_id = get_user_organization_id()
);

-- Create updated_at trigger
CREATE TRIGGER update_voice_agents_updated_at
BEFORE UPDATE ON public.voice_agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_voice_agents_organization_id ON public.voice_agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_voice_agents_active ON public.voice_agents(is_active) WHERE is_active = true;