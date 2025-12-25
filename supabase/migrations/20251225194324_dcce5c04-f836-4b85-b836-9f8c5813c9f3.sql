-- Create job_short_links table for shortened apply URLs
CREATE TABLE public.job_short_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_code VARCHAR(10) NOT NULL UNIQUE,
  job_listing_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  utm_source VARCHAR(50) DEFAULT NULL,
  utm_medium VARCHAR(50) DEFAULT NULL,
  utm_campaign VARCHAR(100) DEFAULT NULL,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for fast lookups
CREATE INDEX idx_job_short_links_short_code ON public.job_short_links(short_code);
CREATE INDEX idx_job_short_links_job_listing_id ON public.job_short_links(job_listing_id);
CREATE INDEX idx_job_short_links_organization_id ON public.job_short_links(organization_id);

-- Enable RLS
ALTER TABLE public.job_short_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read active short links (needed for public redirect)
CREATE POLICY "Short links are publicly readable" 
ON public.job_short_links 
FOR SELECT 
USING (is_active = true);

-- Authenticated users can create short links
CREATE POLICY "Authenticated users can create short links" 
ON public.job_short_links 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update short links they created
CREATE POLICY "Users can update their short links" 
ON public.job_short_links 
FOR UPDATE 
USING (auth.uid() = created_by);

-- Users can delete short links they created
CREATE POLICY "Users can delete their short links" 
ON public.job_short_links 
FOR DELETE 
USING (auth.uid() = created_by);

-- Function to generate unique short code
CREATE OR REPLACE FUNCTION public.generate_short_code(length INTEGER DEFAULT 6)
RETURNS VARCHAR AS $$
DECLARE
  chars VARCHAR := 'abcdefghjkmnpqrstuvwxyz23456789';
  result VARCHAR := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public;