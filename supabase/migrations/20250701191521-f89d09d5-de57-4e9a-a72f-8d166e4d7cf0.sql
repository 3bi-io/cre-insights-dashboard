
-- Make all fields in applications table nullable except id and job_listing_id
ALTER TABLE public.applications 
ALTER COLUMN applicant_name DROP NOT NULL,
ALTER COLUMN applicant_email DROP NOT NULL,
ALTER COLUMN applied_at DROP NOT NULL,
ALTER COLUMN updated_at DROP NOT NULL,
ALTER COLUMN status DROP NOT NULL,
ALTER COLUMN source DROP NOT NULL,
ALTER COLUMN first_name DROP NOT NULL,
ALTER COLUMN email DROP NOT NULL;

-- Set default values for timestamp fields to maintain data integrity
ALTER TABLE public.applications 
ALTER COLUMN applied_at SET DEFAULT now(),
ALTER COLUMN updated_at SET DEFAULT now();
