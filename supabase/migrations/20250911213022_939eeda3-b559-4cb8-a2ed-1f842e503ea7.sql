-- Add adset_id field to applications table for better Meta lead attribution
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS adset_id TEXT,
ADD COLUMN IF NOT EXISTS campaign_id TEXT,
ADD COLUMN IF NOT EXISTS ad_id TEXT;

-- Add index for better performance on Meta attribution queries
CREATE INDEX IF NOT EXISTS idx_applications_meta_attribution 
ON public.applications (adset_id, campaign_id, ad_id) 
WHERE adset_id IS NOT NULL OR campaign_id IS NOT NULL OR ad_id IS NOT NULL;

-- Add index for source-based queries
CREATE INDEX IF NOT EXISTS idx_applications_source_date 
ON public.applications (source, applied_at) 
WHERE source IN ('fb', 'meta', 'facebook', 'instagram');