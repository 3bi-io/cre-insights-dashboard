-- Create candidate_saved_jobs table for the saved jobs feature
CREATE TABLE IF NOT EXISTS public.candidate_saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_profile_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  job_listing_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT candidate_saved_jobs_unique UNIQUE(candidate_profile_id, job_listing_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_candidate_saved_jobs_candidate ON public.candidate_saved_jobs(candidate_profile_id);
CREATE INDEX IF NOT EXISTS idx_candidate_saved_jobs_job ON public.candidate_saved_jobs(job_listing_id);

-- Enable Row Level Security
ALTER TABLE public.candidate_saved_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own saved jobs
CREATE POLICY "Users can view their own saved jobs"
  ON public.candidate_saved_jobs
  FOR SELECT
  USING (
    candidate_profile_id IN (
      SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert their own saved jobs
CREATE POLICY "Users can save jobs"
  ON public.candidate_saved_jobs
  FOR INSERT
  WITH CHECK (
    candidate_profile_id IN (
      SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update their own saved jobs (notes)
CREATE POLICY "Users can update their saved jobs"
  ON public.candidate_saved_jobs
  FOR UPDATE
  USING (
    candidate_profile_id IN (
      SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete their own saved jobs
CREATE POLICY "Users can remove saved jobs"
  ON public.candidate_saved_jobs
  FOR DELETE
  USING (
    candidate_profile_id IN (
      SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid()
    )
  );