-- Create sponsorship tier enum type
DO $$ BEGIN
  CREATE TYPE sponsorship_tier AS ENUM ('premium', 'standard', 'organic');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create campaign sponsorship mappings table
CREATE TABLE IF NOT EXISTS public.campaign_sponsorship_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jobreferrer TEXT NOT NULL UNIQUE,
  tier sponsorship_tier NOT NULL DEFAULT 'organic',
  label TEXT,
  description TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add sponsorship_tier column to job_listings
ALTER TABLE public.job_listings 
ADD COLUMN IF NOT EXISTS sponsorship_tier TEXT DEFAULT 'organic';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_campaign_sponsorship_mappings_jobreferrer 
ON public.campaign_sponsorship_mappings(jobreferrer);

CREATE INDEX IF NOT EXISTS idx_job_listings_sponsorship_tier 
ON public.job_listings(sponsorship_tier);

-- Enable RLS
ALTER TABLE public.campaign_sponsorship_mappings ENABLE ROW LEVEL SECURITY;

-- RLS policies using user_roles table
CREATE POLICY "Users can view mappings"
ON public.campaign_sponsorship_mappings
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  )
  OR organization_id IS NULL
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Admins can manage mappings"
ON public.campaign_sponsorship_mappings
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
);

-- Trigger for updated_at
CREATE TRIGGER update_campaign_sponsorship_mappings_updated_at
BEFORE UPDATE ON public.campaign_sponsorship_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get tier for a jobreferrer
CREATE OR REPLACE FUNCTION public.get_sponsorship_tier(referrer TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (SELECT tier::TEXT FROM public.campaign_sponsorship_mappings WHERE jobreferrer = referrer LIMIT 1),
    'organic'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;