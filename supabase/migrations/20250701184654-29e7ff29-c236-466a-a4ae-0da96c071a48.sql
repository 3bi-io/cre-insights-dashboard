
-- First, add a client_id foreign key column to job_listings table
ALTER TABLE public.job_listings 
ADD COLUMN client_id UUID REFERENCES public.clients(id);

-- Update existing job_listings to link them with the appropriate clients based on location
-- This matches the location data with the client names we just inserted
UPDATE public.job_listings 
SET client_id = (
  SELECT c.id 
  FROM public.clients c 
  WHERE c.city = job_listings.city 
    AND c.state = job_listings.state
)
WHERE job_listings.city IS NOT NULL 
  AND job_listings.state IS NOT NULL;

-- Create an index on client_id for better query performance
CREATE INDEX IF NOT EXISTS idx_job_listings_client_id ON public.job_listings(client_id);
