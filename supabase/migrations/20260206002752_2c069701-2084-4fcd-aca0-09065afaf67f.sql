-- Phase 1: Add new columns to job_listings for feed data capture
ALTER TABLE public.job_listings 
ADD COLUMN IF NOT EXISTS feed_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS indeed_apply_api_token TEXT,
ADD COLUMN IF NOT EXISTS indeed_apply_job_id TEXT,
ADD COLUMN IF NOT EXISTS indeed_apply_post_url TEXT,
ADD COLUMN IF NOT EXISTS tracking_pixel_url TEXT;

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_job_listings_feed_date ON public.job_listings(feed_date);
CREATE INDEX IF NOT EXISTS idx_job_listings_indeed_apply_job_id ON public.job_listings(indeed_apply_job_id) WHERE indeed_apply_job_id IS NOT NULL;

-- Create job_feed_metadata table for raw feed data storage
CREATE TABLE IF NOT EXISTS public.job_feed_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_listing_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  raw_indeed_data JSONB,
  raw_feed_xml TEXT,
  extracted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_job_feed_metadata UNIQUE (job_listing_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_job_feed_metadata_job_listing_id ON public.job_feed_metadata(job_listing_id);
CREATE INDEX IF NOT EXISTS idx_job_feed_metadata_extracted_at ON public.job_feed_metadata(extracted_at);

-- Enable RLS on job_feed_metadata
ALTER TABLE public.job_feed_metadata ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_feed_metadata (follows same org-based access as job_listings via user_roles)
CREATE POLICY "Users can view feed metadata for their org jobs"
ON public.job_feed_metadata
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.job_listings jl
    JOIN public.user_roles ur ON ur.organization_id = jl.organization_id
    WHERE jl.id = job_feed_metadata.job_listing_id
    AND ur.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert feed metadata for their org jobs"
ON public.job_feed_metadata
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.job_listings jl
    JOIN public.user_roles ur ON ur.organization_id = jl.organization_id
    WHERE jl.id = job_feed_metadata.job_listing_id
    AND ur.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update feed metadata for their org jobs"
ON public.job_feed_metadata
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.job_listings jl
    JOIN public.user_roles ur ON ur.organization_id = jl.organization_id
    WHERE jl.id = job_feed_metadata.job_listing_id
    AND ur.user_id = auth.uid()
  )
);

-- Create analytics view for feed data coverage reporting
CREATE OR REPLACE VIEW public.feed_data_coverage AS
SELECT 
  client_id,
  COUNT(*) as total_jobs,
  COUNT(feed_date) as jobs_with_date,
  COUNT(indeed_apply_job_id) as jobs_with_indeed_apply,
  COUNT(tracking_pixel_url) as jobs_with_tracking,
  COUNT(jobreferrer) as jobs_with_campaign,
  ROUND(COUNT(feed_date)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as date_coverage_pct,
  ROUND(COUNT(indeed_apply_job_id)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as indeed_apply_coverage_pct,
  ROUND(COUNT(tracking_pixel_url)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as tracking_coverage_pct,
  ROUND(COUNT(jobreferrer)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as campaign_coverage_pct
FROM public.job_listings
WHERE status = 'active'
GROUP BY client_id;

-- Add trigger for updated_at on job_feed_metadata
CREATE OR REPLACE TRIGGER update_job_feed_metadata_updated_at
BEFORE UPDATE ON public.job_feed_metadata
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();