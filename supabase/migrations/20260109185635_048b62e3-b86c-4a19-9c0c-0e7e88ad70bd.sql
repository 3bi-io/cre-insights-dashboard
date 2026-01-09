-- Add driver_type column to applications table for Company Driver / Owner-Operator
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS driver_type TEXT;

COMMENT ON COLUMN public.applications.driver_type IS 'Type of driver: Company Driver or Owner-Operator';