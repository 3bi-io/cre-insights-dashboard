
-- Drop the existing applications table and recreate with better structure
DROP TABLE IF EXISTS public.applications CASCADE;

-- Create the new applications table with comprehensive fields for Zapier integration
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_listing_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  
  -- Applicant identification (flexible to support various field names)
  applicant_email TEXT,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  phone TEXT,
  
  -- Application metadata
  source TEXT DEFAULT 'Zapier',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'interviewed', 'hired', 'rejected')),
  
  -- Additional fields that might come from forms
  cover_letter TEXT,
  resume_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  notes TEXT,
  
  -- Custom fields for additional data from Zapier
  custom_fields JSONB DEFAULT '{}',
  
  -- Timestamps
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_applications_job_listing_id ON public.applications(job_listing_id);
CREATE INDEX idx_applications_email ON public.applications(applicant_email);
CREATE INDEX idx_applications_email_alt ON public.applications(email);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_applied_at ON public.applications(applied_at);

-- Enable Row Level Security
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "All authenticated users can view applications" 
  ON public.applications 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create applications for their job listings" 
  ON public.applications 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_listings 
      WHERE id = applications.job_listing_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update applications for their job listings" 
  ON public.applications 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.job_listings 
      WHERE id = applications.job_listing_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete applications for their job listings" 
  ON public.applications 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.job_listings 
      WHERE id = applications.job_listing_id 
      AND user_id = auth.uid()
    )
  );

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
