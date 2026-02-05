-- Create embed_tokens table for widget-based application forms
CREATE TABLE public.embed_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token VARCHAR(32) NOT NULL UNIQUE,
  job_listing_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  utm_source VARCHAR(100) DEFAULT 'widget',
  utm_medium VARCHAR(100) DEFAULT 'embed',
  utm_campaign VARCHAR(255),
  allowed_domains TEXT[] DEFAULT '{}',
  impression_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_embed_tokens_token ON public.embed_tokens(token);
CREATE INDEX idx_embed_tokens_job_listing_id ON public.embed_tokens(job_listing_id);
CREATE INDEX idx_embed_tokens_organization_id ON public.embed_tokens(organization_id);
CREATE INDEX idx_embed_tokens_is_active ON public.embed_tokens(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.embed_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies using existing helper functions
CREATE POLICY "Users can view embed tokens in their org"
  ON public.embed_tokens FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Users can create embed tokens in their org"
  ON public.embed_tokens FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Users can update embed tokens in their org"
  ON public.embed_tokens FOR UPDATE
  USING (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Users can delete embed tokens in their org"
  ON public.embed_tokens FOR DELETE
  USING (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

-- Function to generate URL-safe random tokens
CREATE OR REPLACE FUNCTION public.generate_embed_token()
RETURNS VARCHAR(32)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result VARCHAR(32) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..22 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Trigger to auto-generate token if not provided
CREATE OR REPLACE FUNCTION public.set_embed_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.token IS NULL OR NEW.token = '' THEN
    NEW.token := public.generate_embed_token();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER embed_tokens_set_token
  BEFORE INSERT ON public.embed_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.set_embed_token();

-- Trigger for updated_at
CREATE TRIGGER update_embed_tokens_updated_at
  BEFORE UPDATE ON public.embed_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();