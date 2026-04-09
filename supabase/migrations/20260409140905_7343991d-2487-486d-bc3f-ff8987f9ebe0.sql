ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS needs_enrichment boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS enrichment_fields text[] DEFAULT NULL;