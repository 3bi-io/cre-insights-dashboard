-- Create a public function to get screening questions for a job listing
CREATE OR REPLACE FUNCTION public.get_screening_questions_for_job(p_job_listing_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT o.screening_questions
  FROM organizations o
  JOIN job_listings jl ON jl.organization_id = o.id
  WHERE jl.id = p_job_listing_id
  AND o.screening_questions IS NOT NULL;
$$;