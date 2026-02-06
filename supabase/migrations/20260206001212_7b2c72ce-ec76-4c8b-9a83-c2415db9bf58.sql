-- Add jobreferrer and is_sponsored columns to job_listings
ALTER TABLE public.job_listings 
ADD COLUMN IF NOT EXISTS jobreferrer text,
ADD COLUMN IF NOT EXISTS is_sponsored boolean DEFAULT false;

-- Create index for sponsored job queries
CREATE INDEX IF NOT EXISTS idx_job_listings_is_sponsored ON public.job_listings(is_sponsored) WHERE is_sponsored = true;

-- Comment on columns for documentation
COMMENT ON COLUMN public.job_listings.jobreferrer IS 'Campaign/referrer tag from CDL Job Cast feed (e.g., Southeast Solo)';
COMMENT ON COLUMN public.job_listings.is_sponsored IS 'Whether the job is sponsored/paid placement';