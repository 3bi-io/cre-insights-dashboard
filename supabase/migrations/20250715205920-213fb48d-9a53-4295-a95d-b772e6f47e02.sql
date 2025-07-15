-- Make job_listing_id nullable in applications table to allow applications without job listings
ALTER TABLE public.applications ALTER COLUMN job_listing_id DROP NOT NULL;