-- Create junction table for many-to-many relationship between jobs and platforms
CREATE TABLE IF NOT EXISTS public.job_platform_associations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    job_listing_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES public.platforms(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(job_listing_id, platform_id)
);

-- Enable RLS on the junction table
ALTER TABLE public.job_platform_associations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for junction table
CREATE POLICY "Users can view platform associations for their job listings" 
ON public.job_platform_associations 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.job_listings 
    WHERE job_listings.id = job_platform_associations.job_listing_id 
    AND job_listings.user_id = auth.uid()
));

CREATE POLICY "Users can create platform associations for their job listings" 
ON public.job_platform_associations 
FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM public.job_listings 
    WHERE job_listings.id = job_platform_associations.job_listing_id 
    AND job_listings.user_id = auth.uid()
));

CREATE POLICY "Users can update platform associations for their job listings" 
ON public.job_platform_associations 
FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM public.job_listings 
    WHERE job_listings.id = job_platform_associations.job_listing_id 
    AND job_listings.user_id = auth.uid()
));

CREATE POLICY "Users can delete platform associations for their job listings" 
ON public.job_platform_associations 
FOR DELETE 
USING (EXISTS (
    SELECT 1 FROM public.job_listings 
    WHERE job_listings.id = job_platform_associations.job_listing_id 
    AND job_listings.user_id = auth.uid()
));

-- Migrate existing data: Associate all existing jobs with both Meta and X platforms
-- First, associate all jobs with Meta
INSERT INTO public.job_platform_associations (job_listing_id, platform_id)
SELECT id, '62886281-5745-4cc9-9f97-3eded4add741' -- Meta platform ID
FROM public.job_listings
ON CONFLICT (job_listing_id, platform_id) DO NOTHING;

-- Then, associate all jobs with X
INSERT INTO public.job_platform_associations (job_listing_id, platform_id)
SELECT id, '384e675c-2dd2-476c-b0f2-b41d238014bf' -- X platform ID
FROM public.job_listings
ON CONFLICT (job_listing_id, platform_id) DO NOTHING;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_job_platform_associations_job_id ON public.job_platform_associations(job_listing_id);
CREATE INDEX IF NOT EXISTS idx_job_platform_associations_platform_id ON public.job_platform_associations(platform_id);