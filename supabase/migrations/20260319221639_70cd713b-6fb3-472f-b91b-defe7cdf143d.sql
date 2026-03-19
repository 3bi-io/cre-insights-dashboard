ALTER TABLE public.sms_verification_sessions 
  ADD COLUMN IF NOT EXISTS applicant_first_name text,
  ADD COLUMN IF NOT EXISTS job_title text;